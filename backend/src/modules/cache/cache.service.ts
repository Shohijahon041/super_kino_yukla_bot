import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { RedisService } from '../../config/redis.service';

export interface CacheStats {
  totalKeys: number;
  memoryUsedBytes: number;
  memoryUsedHuman: string;
  hitRate: {
    hits: number;
    misses: number;
    ratio: number;
  };
  keyCountByPrefix: Record<string, number>;
}

export interface WarmUpResult {
  cached: number;
  keys: string[];
  durationMs: number;
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  private readonly CACHE_PREFIX = 'cache:';
  private readonly DEFAULT_TTL = 300;
  private readonly TRENDING_TTL = 120;
  private readonly NEW_TTL = 180;
  private readonly TOP_TTL = 300;
  private readonly STATS_TTL = 300;

  private hits = 0;
  private misses = 0;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async get<T = any>(key: string): Promise<T | null> {
    const fullKey = this.normalizeKey(key);
    const raw = await this.redis.get(fullKey);

    if (raw !== null) {
      this.hits++;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return raw as unknown as T;
      }
    }

    this.misses++;
    return null;
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const fullKey = this.normalizeKey(key);
    const ttl = ttlSeconds ?? this.DEFAULT_TTL;
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    await this.redis.set(fullKey, serialized, ttl);
  }

  async del(key: string): Promise<void> {
    const fullKey = this.normalizeKey(key);
    await this.redis.del(fullKey);
  }

  async invalidatePattern(pattern: string): Promise<number> {
    const fullPattern = this.normalizeKey(pattern);
    const client = this.redis.getClient();
    const keys = await client.keys(fullPattern);

    if (keys.length > 0) {
      await client.del(...keys);
      this.logger.debug(`Invalidated ${keys.length} cache keys matching "${pattern}"`);
    }

    return keys.length;
  }

  async warmUp(): Promise<WarmUpResult> {
    const start = Date.now();
    const keys: string[] = [];

    const [trending, newReleases, topRated] = await Promise.all([
      this.warmTrending(),
      this.warmNewReleases(),
      this.warmTopRated(),
    ]);

    keys.push(...trending, ...newReleases, ...topRated);

    const durationMs = Date.now() - start;
    this.logger.log(`Cache warm-up completed: ${keys.length} keys in ${durationMs}ms`);

    return { cached: keys.length, keys, durationMs };
  }

  async getCacheStats(): Promise<CacheStats> {
    const client = this.redis.getClient();

    const [infoResult, dbsize, keyPatterns] = await Promise.all([
      client.info('memory'),
      client.dbsize(),
      Promise.all([
        client.keys(`${this.CACHE_PREFIX}trending:*`),
        client.keys(`${this.CACHE_PREFIX}new:*`),
        client.keys(`${this.CACHE_PREFIX}top:*`),
        client.keys(`${this.CACHE_PREFIX}movie:*`),
        client.keys(`${this.CACHE_PREFIX}stats:*`),
        client.keys(`${this.CACHE_PREFIX}search:*`),
      ]),
    ]);

    const memoryMatch = infoResult.match(/used_memory_human:(\S+)/);
    const memoryBytesMatch = infoResult.match(/used_memory:(\d+)/);
    const totalRequests = this.hits + this.misses;

    const keyCountByPrefix: Record<string, number> = {
      trending: keyPatterns[0].length,
      new: keyPatterns[1].length,
      top: keyPatterns[2].length,
      movie: keyPatterns[3].length,
      stats: keyPatterns[4].length,
      search: keyPatterns[5].length,
    };

    return {
      totalKeys: dbsize,
      memoryUsedBytes: memoryBytesMatch ? parseInt(memoryBytesMatch[1], 10) : 0,
      memoryUsedHuman: memoryMatch?.[1] ?? 'unknown',
      hitRate: {
        hits: this.hits,
        misses: this.misses,
        ratio: totalRequests > 0
          ? Math.round((this.hits / totalRequests) * 10000) / 100
          : 0,
      },
      keyCountByPrefix,
    };
  }

  async flushAll(): Promise<{ flushed: boolean; keysRemoved: number }> {
    const client = this.redis.getClient();
    const dbsize = await client.dbsize();

    const keys = await client.keys(`${this.CACHE_PREFIX}*`);
    if (keys.length > 0) {
      await client.del(...keys);
    }

    this.hits = 0;
    this.misses = 0;

    this.logger.warn(`Cache flushed: ${keys.length} keys removed`);
    return { flushed: true, keysRemoved: keys.length };
  }

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds?: number,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, ttlSeconds);
    return value;
  }

  private async warmTrending(): Promise<string[]> {
    const cacheKey = this.normalizeKey('trending:default');

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const data = await this.prisma.movie.findMany({
      where: {
        isActive: true,
        createdAt: { gte: sevenDaysAgo },
      },
      take: 30,
      orderBy: { viewCount: 'desc' },
      include: {
        genres: {
          include: {
            genre: { select: { id: true, name: true, slug: true, emoji: true } },
          },
        },
        countries: {
          include: {
            country: { select: { id: true, name: true, code: true, flag: true } },
          },
        },
      },
    });

    if (data.length < 30) {
      const existingIds = data.map((m) => m.id);
      const remaining = await this.prisma.movie.findMany({
        where: {
          isActive: true,
          id: { notIn: existingIds },
        },
        take: 30 - data.length,
        orderBy: { viewCount: 'desc' },
        include: {
          genres: {
            include: {
              genre: { select: { id: true, name: true, slug: true, emoji: true } },
            },
          },
          countries: {
            include: {
              country: { select: { id: true, name: true, code: true, flag: true } },
            },
          },
        },
      });
      data.push(...remaining);
    }

    await this.set('trending:default', data, this.TRENDING_TTL);

    const limit = 10;
    const topSlugs = data.slice(0, limit);
    const slugKeys: string[] = [cacheKey];

    for (let i = 0; i < topSlugs.length; i++) {
      const slugKey = this.normalizeKey(`trending:by_rank:${i}`);
      await this.redis.set(slugKey, JSON.stringify(topSlugs[i]), this.TRENDING_TTL);
      slugKeys.push(slugKey);
    }

    return slugKeys;
  }

  private async warmNewReleases(): Promise<string[]> {
    const keys: string[] = [];

    const forLimits = [20, 50];

    for (const limit of forLimits) {
      const data = await this.prisma.movie.findMany({
        where: { isActive: true },
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          genres: {
            include: {
              genre: { select: { id: true, name: true, slug: true, emoji: true } },
            },
          },
          countries: {
            include: {
              country: { select: { id: true, name: true, code: true, flag: true } },
            },
          },
        },
      });

      const cacheKey = `new:limit_${limit}`;
      await this.set(cacheKey, data, this.NEW_TTL);
      keys.push(this.normalizeKey(cacheKey));
    }

    return keys;
  }

  private async warmTopRated(): Promise<string[]> {
    const keys: string[] = [];

    const forLimits = [20, 50];

    for (const limit of forLimits) {
      const data = await this.prisma.movie.findMany({
        where: {
          isActive: true,
          ratingCount: { gt: 0 },
        },
        take: limit,
        orderBy: { rating: 'desc' },
        include: {
          genres: {
            include: {
              genre: { select: { id: true, name: true, slug: true, emoji: true } },
            },
          },
          countries: {
            include: {
              country: { select: { id: true, name: true, code: true, flag: true } },
            },
          },
        },
      });

      const cacheKey = `top:limit_${limit}`;
      await this.set(cacheKey, data, this.TOP_TTL);
      keys.push(this.normalizeKey(cacheKey));
    }

    return keys;
  }

  private normalizeKey(key: string): string {
    return key.startsWith(this.CACHE_PREFIX) ? key : `${this.CACHE_PREFIX}${key}`;
  }
}
