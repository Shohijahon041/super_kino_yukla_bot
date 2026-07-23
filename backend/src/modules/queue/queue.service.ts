import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Queue,
  Worker,
  Job,
  JobsOptions,
} from 'bullmq';
import Redis from 'ioredis';

export enum VideoProcessingJob {
  TRANSCODE = 'video-transcode',
  THUMBNAIL = 'video-thumbnail',
  SCREENSHOTS = 'video-screenshots',
  OPTIMIZE = 'video-optimize',
  METADATA = 'video-metadata',
}

export enum ImageProcessingJob {
  OPTIMIZE = 'image-optimize',
  THUMBNAIL = 'image-thumbnail',
  WATERMARK = 'image-watermark',
  RESIZE = 'image-resize',
}

export enum BroadcastJob {
  SEND = 'broadcast-send',
}

export enum MetadataSyncJob {
  TMDB = 'metadata-tmdb-sync',
  IMDB = 'metadata-imdb-sync',
}

export enum RecommendationRefreshJob {
  REFRESH = 'recommendation-refresh',
}

export interface QueueStats {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
}

export interface JobStatusResponse {
  id: string;
  queueName: string;
  name: string;
  data: any;
  progress: number | null;
  status: string;
  attemptsMade: number;
  failedReason: string | null;
  processedOn: number | null;
  finishedOn: number | null;
  createdOn: number;
}

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);
  private readonly queues: Map<string, Queue> = new Map();
  private readonly connection: any;

  constructor(private readonly config: ConfigService) {
    this.connection = {
      host: this.config.get('REDIS_HOST', 'localhost'),
      port: Number(this.config.get('REDIS_PORT', 6379)),
      password: this.config.get('REDIS_PASSWORD') || undefined,
      maxRetriesPerRequest: null,
    } as any;
  }

  private getOrCreateQueue(name: string): Queue {
    if (!this.queues.has(name)) {
      const queue = new Queue(name, {
        connection: this.connection,
        defaultJobOptions: {
          removeOnComplete: { age: 86400, count: 1000 },
          removeOnFail: { age: 604800, count: 500 },
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      });

      queue.on('error', (error) => {
        this.logger.error(`Queue "${name}" error:`, error.message);
      });

      this.queues.set(name, queue);
    }

    return this.queues.get(name)!;
  }

  async addVideoProcessingJob(
    videoId: string,
    videoUrl: string,
    options?: {
      qualities?: string[];
      generateScreenshots?: boolean;
      generateThumbnail?: boolean;
      metadata?: Record<string, any>;
    },
  ): Promise<Job> {
    const queue = this.getOrCreateQueue('video-processing');

    const job = await queue.add(
      VideoProcessingJob.TRANSCODE,
      {
        videoId,
        videoUrl,
        qualities: options?.qualities ?? ['1080p', '720p', '480p'],
        generateScreenshots: options?.generateScreenshots ?? true,
        generateThumbnail: options?.generateThumbnail ?? true,
        metadata: options?.metadata ?? {},
      },
      {
        priority: 5,
        jobId: `video-${videoId}-${Date.now()}`,
      },
    );

    this.logger.log(`Video processing job added: ${job.id} for video ${videoId}`);
    return job;
  }

  async addImageProcessingJob(
    imageId: string,
    imageUrl: string,
    options?: {
      sizes?: { width: number; height: number; suffix: string }[];
      format?: 'jpeg' | 'png' | 'webp' | 'avif';
      quality?: number;
      watermark?: boolean;
    },
  ): Promise<Job> {
    const queue = this.getOrCreateQueue('image-processing');

    const job = await queue.add(
      ImageProcessingJob.OPTIMIZE,
      {
        imageId,
        imageUrl,
        sizes: options?.sizes ?? [
          { width: 1920, height: 1080, suffix: 'large' },
          { width: 800, height: 450, suffix: 'medium' },
          { width: 400, height: 225, suffix: 'small' },
        ],
        format: options?.format ?? 'webp',
        quality: options?.quality ?? 80,
        watermark: options?.watermark ?? false,
      },
      {
        priority: 3,
        jobId: `image-${imageId}-${Date.now()}`,
      },
    );

    this.logger.log(`Image processing job added: ${job.id} for image ${imageId}`);
    return job;
  }

  async addBroadcastJob(
    broadcastId: string,
    title: string,
    message: string,
    options?: {
      targetType?: string;
      targetIds?: string[];
      mediaUrl?: string;
      scheduledAt?: Date;
    },
  ): Promise<Job> {
    const queue = this.getOrCreateQueue('broadcasts');

    const jobOptions: JobsOptions = {
      priority: 1,
      jobId: `broadcast-${broadcastId}-${Date.now()}`,
    };

    if (options?.scheduledAt) {
      jobOptions.delay = Math.max(0, options.scheduledAt.getTime() - Date.now());
    }

    const job = await queue.add(
      BroadcastJob.SEND,
      {
        broadcastId,
        title,
        message,
        targetType: options?.targetType ?? 'all',
        targetIds: options?.targetIds ?? [],
        mediaUrl: options?.mediaUrl ?? null,
      },
      jobOptions,
    );

    this.logger.log(`Broadcast job added: ${job.id} for broadcast ${broadcastId}`);
    return job;
  }

  async addMetadataSyncJob(
    syncType: 'tmdb' | 'imdb',
    options?: {
      movieIds?: string[];
      fullSync?: boolean;
      priority?: number;
    },
  ): Promise<Job> {
    const queue = this.getOrCreateQueue('metadata-sync');
    const name = syncType === 'tmdb' ? MetadataSyncJob.TMDB : MetadataSyncJob.IMDB;

    const job = await queue.add(
      name,
      {
        syncType,
        movieIds: options?.movieIds ?? [],
        fullSync: options?.fullSync ?? false,
        initiatedAt: new Date().toISOString(),
      },
      {
        priority: options?.priority ?? 7,
        jobId: `metadata-${syncType}-${Date.now()}`,
      },
    );

    this.logger.log(`Metadata sync job added: ${job.id} (${syncType})`);
    return job;
  }

  async addRecommendationRefreshJob(
    options?: {
      userIds?: string[];
      algorithm?: string;
    },
  ): Promise<Job> {
    const queue = this.getOrCreateQueue('recommendations');

    const job = await queue.add(
      RecommendationRefreshJob.REFRESH,
      {
        userIds: options?.userIds ?? [],
        algorithm: options?.algorithm ?? 'hybrid',
        initiatedAt: new Date().toISOString(),
      },
      {
        priority: 6,
        jobId: `recommendation-refresh-${Date.now()}`,
        repeat: {
          every: 3600000,
        },
      },
    );

    this.logger.log(`Recommendation refresh job added: ${job.id}`);
    return job;
  }

  async getQueueStats(): Promise<QueueStats[]> {
    const queueNames = [
      'video-processing',
      'image-processing',
      'broadcasts',
      'metadata-sync',
      'recommendations',
    ];

    const stats: QueueStats[] = [];

    for (const name of queueNames) {
      const queue = this.getOrCreateQueue(name);

      try {
        const [waiting, active, completed, failed, delayed, isPaused] = await Promise.all([
          queue.getWaitingCount(),
          queue.getActiveCount(),
          queue.getCompletedCount(),
          queue.getFailedCount(),
          queue.getDelayedCount(),
          queue.isPaused(),
        ]);

        stats.push({
          name,
          waiting,
          active,
          completed,
          failed,
          delayed,
          paused: isPaused,
        });
      } catch (error) {
        this.logger.error(`Failed to get stats for queue "${name}":`, error?.message);
        stats.push({
          name,
          waiting: 0,
          active: 0,
          completed: 0,
          failed: 0,
          delayed: 0,
          paused: false,
        });
      }
    }

    return stats;
  }

  async getJobStatus(jobId: string): Promise<JobStatusResponse> {
    const queueNames = [
      'video-processing',
      'image-processing',
      'broadcasts',
      'metadata-sync',
      'recommendations',
    ];

    for (const queueName of queueNames) {
      const queue = this.getOrCreateQueue(queueName);
      const job = await queue.getJob(jobId);

      if (job) {
        const state = await job.getState();
        return {
          id: job.id!,
          queueName,
          name: job.name,
          data: job.data,
          progress: job.progress as number | null,
          status: state,
          attemptsMade: job.attemptsMade,
          failedReason: job.failedReason ?? null,
          processedOn: job.processedOn ?? null,
          finishedOn: job.finishedOn ?? null,
          createdOn: job.timestamp,
        };
      }
    }

    throw new NotFoundException(`Job with ID "${jobId}" not found in any queue`);
  }

  async getJobById(jobId: string): Promise<Job | null> {
    const queueNames = [
      'video-processing',
      'image-processing',
      'broadcasts',
      'metadata-sync',
      'recommendations',
    ];

    for (const queueName of queueNames) {
      const queue = this.getOrCreateQueue(queueName);
      const job = await queue.getJob(jobId);
      if (job) return job;
    }

    return null;
  }

  async retryJob(jobId: string): Promise<{ retried: boolean; jobId: string }> {
    const job = await this.getJobById(jobId);
    if (!job) {
      throw new NotFoundException(`Job "${jobId}" not found`);
    }

    await job.retry();
    return { retried: true, jobId };
  }

  async removeJob(jobId: string): Promise<{ removed: boolean; jobId: string }> {
    const job = await this.getJobById(jobId);
    if (!job) {
      throw new NotFoundException(`Job "${jobId}" not found`);
    }

    await job.remove();
    return { removed: true, jobId };
  }

  async pauseQueue(queueName: string): Promise<{ paused: boolean; queue: string }> {
    const queue = this.getOrCreateQueue(queueName);
    await queue.pause();
    return { paused: true, queue: queueName };
  }

  async resumeQueue(queueName: string): Promise<{ resumed: boolean; queue: string }> {
    const queue = this.getOrCreateQueue(queueName);
    await queue.resume();
    return { resumed: true, queue: queueName };
  }

  async cleanQueue(
    queueName: string,
    grace: number = 86400000,
  ): Promise<{ cleaned: number; queue: string }> {
    const queue = this.getOrCreateQueue(queueName);
    const cleanedJobs = await queue.clean(grace, 1000, 'completed');
    const cleanedFailed = await queue.clean(grace, 1000, 'failed');

    return {
      cleaned: cleanedJobs.length + cleanedFailed.length,
      queue: queueName,
    };
  }

  async createWorker(
    queueName: string,
    processor: (job: Job) => Promise<any>,
    concurrency: number = 1,
  ): Promise<Worker> {
    const worker = new Worker(queueName, processor, {
      connection: this.connection,
      concurrency,
      limiter: {
        max: 100,
        duration: 1000,
      },
    });

    worker.on('completed', (job) => {
      this.logger.debug(`Job ${job.id} completed in queue "${queueName}"`);
    });

    worker.on('failed', (job, error) => {
      this.logger.error(
        `Job ${job?.id} failed in queue "${queueName}": ${error.message}`,
      );
    });

    worker.on('error', (error) => {
      this.logger.error(`Worker error in queue "${queueName}":`, error.message);
    });

    return worker;
  }

  async shutdown(): Promise<void> {
    for (const [name, queue] of this.queues) {
      try {
        await queue.close();
        this.logger.log(`Queue "${name}" closed`);
      } catch (error) {
        this.logger.error(`Failed to close queue "${name}":`, error?.message);
      }
    }
    this.queues.clear();
  }
}
