import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { QueueService } from './queue.service';

@ApiTags('Queue')
@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Get('stats')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get queue statistics',
    description:
      'Returns statistics for all queues including waiting, active, completed, failed, and delayed job counts.',
  })
  @ApiResponse({ status: 200, description: 'Queue statistics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getQueueStats() {
    return this.queueService.getQueueStats();
  }

  @Get('job/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get job status',
    description: 'Returns the current status and details of a specific job by its ID.',
  })
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiResponse({ status: 200, description: 'Job status retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async getJobStatus(@Param('id') id: string) {
    return this.queueService.getJobStatus(id);
  }

  @Post('video-process')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add video processing job',
    description:
      'Enqueue a video for processing including transcoding, thumbnail generation, and screenshots.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        videoId: { type: 'string', description: 'Video UUID' },
        videoUrl: { type: 'string', description: 'Source video URL or path' },
        qualities: {
          type: 'array',
          items: { type: 'string' },
          example: ['1080p', '720p', '480p'],
          description: 'Target output qualities',
        },
        generateScreenshots: { type: 'boolean', default: true },
        generateThumbnail: { type: 'boolean', default: true },
      },
      required: ['videoId', 'videoUrl'],
    },
  })
  @ApiResponse({ status: 201, description: 'Video processing job queued successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async addVideoProcessingJob(
    @Body() body: {
      videoId: string;
      videoUrl: string;
      qualities?: string[];
      generateScreenshots?: boolean;
      generateThumbnail?: boolean;
    },
  ) {
    if (!body.videoId || !body.videoUrl) {
      throw new BadRequestException('videoId and videoUrl are required');
    }

    const job = await this.queueService.addVideoProcessingJob(
      body.videoId,
      body.videoUrl,
      {
        qualities: body.qualities,
        generateScreenshots: body.generateScreenshots,
        generateThumbnail: body.generateThumbnail,
      },
    );

    return {
      jobId: job.id,
      status: 'queued',
      queueName: 'video-processing',
    };
  }

  @Post('broadcast')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add broadcast job',
    description: 'Enqueue a broadcast message to be sent to users.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        broadcastId: { type: 'string', description: 'Broadcast UUID' },
        title: { type: 'string', description: 'Broadcast title' },
        message: { type: 'string', description: 'Broadcast message body' },
        targetType: {
          type: 'string',
          enum: ['all', 'premium', 'specific'],
          default: 'all',
        },
        targetIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific user IDs (when targetType is "specific")',
        },
        mediaUrl: { type: 'string', description: 'Optional media attachment URL' },
        scheduledAt: {
          type: 'string',
          format: 'date-time',
          description: 'Optional scheduled time (ISO 8601)',
        },
      },
      required: ['broadcastId', 'title', 'message'],
    },
  })
  @ApiResponse({ status: 201, description: 'Broadcast job queued successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async addBroadcastJob(
    @Body() body: {
      broadcastId: string;
      title: string;
      message: string;
      targetType?: string;
      targetIds?: string[];
      mediaUrl?: string;
      scheduledAt?: string;
    },
  ) {
    if (!body.broadcastId || !body.title || !body.message) {
      throw new BadRequestException('broadcastId, title, and message are required');
    }

    const job = await this.queueService.addBroadcastJob(
      body.broadcastId,
      body.title,
      body.message,
      {
        targetType: body.targetType,
        targetIds: body.targetIds,
        mediaUrl: body.mediaUrl,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
      },
    );

    return {
      jobId: job.id,
      status: 'queued',
      queueName: 'broadcasts',
    };
  }
}
