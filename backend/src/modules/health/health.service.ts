import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { RedisService } from '../../config/redis.service';
import * as os from 'os';
import * as fs from 'fs';

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface ComponentHealth {
  name: string;
  status: HealthStatus;
  latencyMs: number;
  message?: string;
}

export interface HealthCheckResult {
  status: HealthStatus;
  version: string;
  uptime: number;
  timestamp: string;
  checks: ComponentHealth[];
}

export interface ReadinessResult {
  status: HealthStatus;
  ready: boolean;
  timestamp: string;
}

export interface LivenessResult {
  status: HealthStatus;
  alive: boolean;
  uptime: number;
  timestamp: string;
}

export interface DiskSpaceInfo {
  totalBytes: number;
  freeBytes: number;
  usedBytes: number;
  usedPercent: number;
}

export interface MemoryInfo {
  totalBytes: number;
  freeBytes: number;
  usedBytes: number;
  usedPercent: number;
  processHeapUsedBytes: number;
  processHeapTotalBytes: number;
  processRssBytes: number;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime = Date.now();
  private readonly version: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {
    try {
      const pkg = JSON.parse(
        fs.readFileSync(
          require.resolve('../../../../package.json'),
          'utf-8',
        ),
      );
      this.version = pkg.version;
    } catch {
      this.version = 'unknown';
    }
  }

  async checkDatabase(): Promise<ComponentHealth> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        name: 'database',
        status: 'healthy',
        latencyMs: Date.now() - start,
      };
    } catch (error) {
      this.logger.error('Database health check failed', error?.message);
      return {
        name: 'database',
        status: 'unhealthy',
        latencyMs: Date.now() - start,
        message: error?.message ?? 'Database connection failed',
      };
    }
  }

  async checkRedis(): Promise<ComponentHealth> {
    const start = Date.now();
    try {
      const client = this.redis.getClient();
      const pong = await client.ping();
      if (pong === 'PONG') {
        return {
          name: 'redis',
          status: 'healthy',
          latencyMs: Date.now() - start,
        };
      }
      return {
        name: 'redis',
        status: 'degraded',
        latencyMs: Date.now() - start,
        message: `Unexpected PING response: ${pong}`,
      };
    } catch (error) {
      this.logger.error('Redis health check failed', error?.message);
      return {
        name: 'redis',
        status: 'unhealthy',
        latencyMs: Date.now() - start,
        message: error?.message ?? 'Redis connection failed',
      };
    }
  }

  async checkDiskSpace(): Promise<ComponentHealth> {
    const start = Date.now();
    try {
      const info = await this.getDiskSpace();
      const status: HealthStatus =
        info.usedPercent > 95 ? 'unhealthy' : info.usedPercent > 85 ? 'degraded' : 'healthy';

      return {
        name: 'disk',
        status,
        latencyMs: Date.now() - start,
        message: `${info.usedPercent.toFixed(1)}% used (${this.formatBytes(info.freeBytes)} free)`,
      };
    } catch (error) {
      this.logger.error('Disk space check failed', error?.message);
      return {
        name: 'disk',
        status: 'unhealthy',
        latencyMs: Date.now() - start,
        message: error?.message ?? 'Failed to read disk space',
      };
    }
  }

  async checkMemory(): Promise<ComponentHealth> {
    const start = Date.now();
    try {
      const info = await this.getMemoryInfo();
      const status: HealthStatus =
        info.usedPercent > 95 ? 'unhealthy' : info.usedPercent > 85 ? 'degraded' : 'healthy';

      return {
        name: 'memory',
        status,
        latencyMs: Date.now() - start,
        message: `${info.usedPercent.toFixed(1)}% used (${this.formatBytes(info.freeBytes)} free)`,
      };
    } catch (error) {
      this.logger.error('Memory check failed', error?.message);
      return {
        name: 'memory',
        status: 'unhealthy',
        latencyMs: Date.now() - start,
        message: error?.message ?? 'Failed to read memory info',
      };
    }
  }

  async getOverallHealth(): Promise<HealthCheckResult> {
    const checks = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkDiskSpace(),
      this.checkMemory(),
    ]);

    const worstStatus = this.getWorstStatus(checks.map((c) => c.status));

    return {
      status: worstStatus,
      version: this.version,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date().toISOString(),
      checks,
    };
  }

  async getReadiness(): Promise<ReadinessResult> {
    const dbCheck = await this.checkDatabase();
    const redisCheck = await this.checkRedis();
    const checks = [dbCheck, redisCheck];
    const status = this.getWorstStatus(checks.map((c) => c.status));

    return {
      status,
      ready: status !== 'unhealthy',
      timestamp: new Date().toISOString(),
    };
  }

  getLiveness(): LivenessResult {
    return {
      status: 'healthy',
      alive: true,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date().toISOString(),
    };
  }

  async getDiskSpace(): Promise<DiskSpaceInfo> {
    const stats = fs.statfsSync('/');
    const totalBytes = stats.blocks * stats.bsize;
    const freeBytes = stats.bfree * stats.bsize;
    const usedBytes = totalBytes - freeBytes;
    const usedPercent = totalBytes > 0 ? (usedBytes / totalBytes) * 100 : 0;

    return { totalBytes, freeBytes, usedBytes, usedPercent };
  }

  async getMemoryInfo(): Promise<MemoryInfo> {
    const totalBytes = os.totalmem();
    const freeBytes = os.freemem();
    const usedBytes = totalBytes - freeBytes;
    const usedPercent = totalBytes > 0 ? (usedBytes / totalBytes) * 100 : 0;
    const processMem = process.memoryUsage();

    return {
      totalBytes,
      freeBytes,
      usedBytes,
      usedPercent,
      processHeapUsedBytes: processMem.heapUsed,
      processHeapTotalBytes: processMem.heapTotal,
      processRssBytes: processMem.rss,
    };
  }

  private getWorstStatus(statuses: HealthStatus[]): HealthStatus {
    if (statuses.includes('unhealthy')) return 'unhealthy';
    if (statuses.includes('degraded')) return 'degraded';
    return 'healthy';
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
  }
}
