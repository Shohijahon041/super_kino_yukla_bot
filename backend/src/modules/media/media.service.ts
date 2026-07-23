import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import * as Minio from 'minio';
import { v4 as uuid } from 'uuid';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

const execFileAsync = promisify(execFile);

export interface UploadResult {
  key: string;
  url: string;
  bucket: string;
  size: number;
  mimeType: string;
}

export interface ThumbnailResult {
  key: string;
  url: string;
  width: number;
  height: number;
}

export interface ScreenshotResult {
  key: string;
  url: string;
  timestamp: number;
  width: number;
  height: number;
}

export interface PresignedUrlResult {
  url: string;
  expiresAt: string;
}

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
];

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/avi',
  'video/mkv',
  'video/mov',
  'video/quicktime',
];

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly minioClient: Minio.Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.get('MINIO_BUCKET', 'cinemahub-media');

    this.minioClient = new Minio.Client({
      endPoint: this.config.get('MINIO_ENDPOINT', 'localhost'),
      port: Number(this.config.get('MINIO_PORT', 9000)),
      useSSL: this.config.get('MINIO_USE_SSL', 'false') === 'true',
      accessKey: this.config.get('MINIO_ACCESS_KEY', 'minioadmin'),
      secretKey: this.config.get('MINIO_SECRET_KEY', 'minioadmin'),
    });

    this.ensureBucket().catch((err) => {
      this.logger.error('Failed to ensure bucket exists', err?.message);
    });
  }

  private async ensureBucket(): Promise<void> {
    const exists = await this.minioClient.bucketExists(this.bucket);
    if (!exists) {
      await this.minioClient.makeBucket(this.bucket);
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${this.bucket}/*`],
          },
        ],
      };
      await this.minioClient.setBucketPolicy(this.bucket, JSON.stringify(policy));
      this.logger.log(`Bucket "${this.bucket}" created with public read policy`);
    }
  }

  async uploadImage(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    folder = 'images',
  ): Promise<UploadResult> {
    if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) {
      throw new BadRequestException(
        `Unsupported image type: ${mimeType}. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
      );
    }

    const ext = this.getExtension(originalName, mimeType);
    const key = `${folder}/${uuid()}.${ext}`;

    await this.minioClient.putObject(this.bucket, key, buffer, buffer.length, {
      'Content-Type': mimeType,
    });

    const url = await this.getPresignedUrl(key);

    return {
      key,
      url,
      bucket: this.bucket,
      size: buffer.length,
      mimeType,
    };
  }

  async uploadVideo(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    folder = 'videos',
  ): Promise<UploadResult> {
    if (!ALLOWED_VIDEO_TYPES.includes(mimeType)) {
      throw new BadRequestException(
        `Unsupported video type: ${mimeType}. Allowed: ${ALLOWED_VIDEO_TYPES.join(', ')}`,
      );
    }

    const ext = this.getExtension(originalName, mimeType);
    const key = `${folder}/${uuid()}.${ext}`;

    await this.minioClient.putObject(this.bucket, key, buffer, buffer.length, {
      'Content-Type': mimeType,
    });

    const url = await this.getPresignedUrl(key);

    return {
      key,
      url,
      bucket: this.bucket,
      size: buffer.length,
      mimeType,
    };
  }

  async generateThumbnail(
    imageBuffer: Buffer,
    width = 400,
    height = 600,
    folder = 'thumbnails',
  ): Promise<ThumbnailResult> {
    const key = `${folder}/${uuid()}.webp`;

    const processed = await sharp(imageBuffer)
      .resize(width, height, { fit: 'cover', position: 'center' })
      .webp({ quality: 80 })
      .toBuffer();

    await this.minioClient.putObject(this.bucket, key, processed, processed.length, {
      'Content-Type': 'image/webp',
    });

    const url = await this.getPresignedUrl(key);

    return { key, url, width, height };
  }

  async generateScreenshots(
    videoPath: string,
    count = 5,
    folder = 'screenshots',
  ): Promise<ScreenshotResult[]> {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cinemahub-screenshots-'));

    try {
      const ffprobeOutput = await this.getVideoDuration(videoPath);
      const duration = ffprobeOutput.duration;

      if (duration <= 0) {
        throw new BadRequestException('Video has zero or unknown duration');
      }

      const interval = duration / (count + 1);
      const results: ScreenshotResult[] = [];

      for (let i = 1; i <= count; i++) {
        const timestamp = Math.round(interval * i);
        const outputPath = path.join(tmpDir, `screenshot_${i}.jpg`);

        await execFileAsync('ffmpeg', [
          '-ss',
          String(timestamp),
          '-i',
          videoPath,
          '-vframes',
          '1',
          '-q:v',
          '2',
          '-y',
          outputPath,
        ]);

        const screenshotBuffer = fs.readFileSync(outputPath);
        const metadata = await sharp(screenshotBuffer).metadata();
        const key = `${folder}/${uuid()}.webp`;

        const webpBuffer = await sharp(screenshotBuffer)
          .webp({ quality: 85 })
          .toBuffer();

        await this.minioClient.putObject(this.bucket, key, webpBuffer, webpBuffer.length, {
          'Content-Type': 'image/webp',
        });

        const url = await this.getPresignedUrl(key);

        results.push({
          key,
          url,
          timestamp,
          width: metadata.width ?? 1920,
          height: metadata.height ?? 1080,
        });
      }

      return results;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error('Failed to generate screenshots', error?.message);
      throw new InternalServerErrorException(
        `Screenshot generation failed: ${error?.message ?? 'Unknown error'}`,
      );
    } finally {
      this.cleanupTmpDir(tmpDir);
    }
  }

  async optimizeImage(
    buffer: Buffer,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'jpeg' | 'png' | 'webp' | 'avif';
    } = {},
  ): Promise<Buffer> {
    const { width, height, quality = 80, format = 'webp' } = options;

    let pipeline = sharp(buffer);

    if (width || height) {
      pipeline = pipeline.resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    switch (format) {
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality, progressive: true, mozjpeg: true });
        break;
      case 'png':
        pipeline = pipeline.png({ quality, compressionLevel: 9 });
        break;
      case 'webp':
        pipeline = pipeline.webp({ quality });
        break;
      case 'avif':
        pipeline = pipeline.avif({ quality });
        break;
    }

    return pipeline.toBuffer();
  }

  async getPresignedUrl(key: string, expirySeconds = 3600): Promise<string> {
    try {
      return await this.minioClient.presignedGetObject(this.bucket, key, expirySeconds);
    } catch (error) {
      this.logger.error(`Failed to generate presigned URL for key: ${key}`, error?.message);
      throw new InternalServerErrorException('Failed to generate download URL');
    }
  }

  async getPresignedUrlWithExpiry(
    key: string,
    expirySeconds = 3600,
  ): Promise<PresignedUrlResult> {
    const url = await this.getPresignedUrl(key, expirySeconds);
    const expiresAt = new Date(Date.now() + expirySeconds * 1000).toISOString();
    return { url, expiresAt };
  }

  async deleteFile(key: string): Promise<{ deleted: boolean; key: string }> {
    try {
      await this.minioClient.removeObject(this.bucket, key);
      return { deleted: true, key };
    } catch (error) {
      this.logger.error(`Failed to delete file: ${key}`, error?.message);
      throw new InternalServerErrorException(`Failed to delete file: ${key}`);
    }
  }

  async deleteFiles(keys: string[]): Promise<{ deleted: string[]; failed: string[] }> {
    const deleted: string[] = [];
    const failed: string[] = [];

    for (const key of keys) {
      try {
        await this.minioClient.removeObject(this.bucket, key);
        deleted.push(key);
      } catch {
        failed.push(key);
      }
    }

    return { deleted, failed };
  }

  async getFileInfo(key: string): Promise<{
    size: number;
    lastModified: Date;
    etag: string;
    contentType: string;
  }> {
    try {
      const stat = await this.minioClient.statObject(this.bucket, key);
      return {
        size: stat.size,
        lastModified: stat.lastModified,
        etag: stat.etag,
        contentType: stat.metaData?.['content-type'] ?? 'application/octet-stream',
      };
    } catch (error) {
      this.logger.error(`Failed to get file info: ${key}`, error?.message);
      throw new InternalServerErrorException(`Failed to get file info: ${key}`);
    }
  }

  async listFiles(
    prefix: string,
    maxKeys = 1000,
  ): Promise<{ key: string; size: number; lastModified: Date }[]> {
    const files: { key: string; size: number; lastModified: Date }[] = [];
    const stream = this.minioClient.listObjects(this.bucket, prefix, true);

    return new Promise((resolve, reject) => {
      stream.on('data', (obj) => {
        if (files.length < maxKeys) {
          files.push({
            key: obj.name!,
            size: obj.size!,
            lastModified: obj.lastModified!,
          });
        }
      });
      stream.on('error', reject);
      stream.on('end', () => resolve(files));
    });
  }

  private async getVideoDuration(
    videoPath: string,
  ): Promise<{ duration: number; width: number; height: number }> {
    const { stdout } = await execFileAsync('ffprobe', [
      '-v',
      'quiet',
      '-print_format',
      'json',
      '-show_format',
      '-show_streams',
      videoPath,
    ]);

    const info = JSON.parse(stdout);
    const duration = parseFloat(info.format?.duration ?? '0');
    const videoStream = info.streams?.find(
      (s: any) => s.codec_type === 'video',
    );

    return {
      duration,
      width: parseInt(videoStream?.width ?? '0', 10),
      height: parseInt(videoStream?.height ?? '0', 10),
    };
  }

  private cleanupTmpDir(dir: string): void {
    try {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    } catch (error) {
      this.logger.warn(`Failed to cleanup temp dir: ${dir}`);
    }
  }

  private getExtension(originalName: string, mimeType: string): string {
    const fromName = path.extname(originalName).replace('.', '').toLowerCase();
    if (fromName) return fromName;

    const mimeMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'image/avif': 'avif',
      'video/mp4': 'mp4',
      'video/webm': 'webm',
      'video/avi': 'avi',
      'video/mkv': 'mkv',
      'video/mov': 'mov',
    };

    return mimeMap[mimeType] ?? 'bin';
  }
}
