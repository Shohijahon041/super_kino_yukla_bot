import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service';
import { RedisService } from '../../config/redis.service';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import {
  BroadcastDto,
  GetBroadcastHistoryDto,
  BulkImportMovieDto,
  GetAdminActionsDto,
  AnalyticsPeriodDto,
} from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getDashboardStats() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalMovies,
      totalSeries,
      totalUsers,
      activeToday,
      newUsersToday,
      totalViewsResult,
      topGenres,
      topCountries,
      activeSubscriptions,
      pendingReports,
      totalBroadcasts,
    ] = await Promise.all([
      this.prisma.movie.count({ where: { isActive: true } }),
      this.prisma.series.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.loginHistory.count({
        where: { createdAt: { gte: startOfDay } },
      }),
      this.prisma.user.count({
        where: { createdAt: { gte: startOfDay } },
      }),
      this.prisma.movie.aggregate({
        where: { isActive: true },
        _sum: { viewCount: true },
      }),
      this.prisma.movieGenre.groupBy({
        by: ['genreId'],
        _count: { movieId: true },
        orderBy: { _count: { movieId: 'desc' } },
        take: 5,
      }),
      this.prisma.movieCountry.groupBy({
        by: ['countryId'],
        _count: { movieId: true },
        orderBy: { _count: { movieId: 'desc' } },
        take: 5,
      }),
      this.prisma.subscription.count({ where: { status: 'active' } }),
      this.prisma.report.count({ where: { status: 'pending' } }),
      this.prisma.broadcast.count(),
    ]);

    const genreIds = topGenres.map((g) => g.genreId);
    const countryIds = topCountries.map((c) => c.countryId);

    const [genreRecords, countryRecords] = await Promise.all([
      genreIds.length > 0
        ? this.prisma.genre.findMany({ where: { id: { in: genreIds } } })
        : [],
      countryIds.length > 0
        ? this.prisma.country.findMany({ where: { id: { in: countryIds } } })
        : [],
    ]);

    const genreMap = new Map(genreRecords.map((g) => [g.id, g]));
    const countryMap = new Map(countryRecords.map((c) => [c.id, c]));

    return {
      totalMovies,
      totalSeries,
      totalUsers,
      activeToday,
      newUsersToday,
      totalViews: totalViewsResult._sum.viewCount ?? 0,
      activeSubscriptions,
      pendingReports,
      totalBroadcasts,
      topGenres: topGenres.map((g) => ({
        genre: genreMap.get(g.genreId),
        count: g._count.movieId,
      })),
      topCountries: topCountries.map((c) => ({
        country: countryMap.get(c.countryId),
        count: c._count.movieId,
      })),
    };
  }

  async getAnalytics(dto: AnalyticsPeriodDto) {
    const now = new Date();
    let startDate: Date;

    switch (dto.period) {
      case 'day':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }

    const [
      newUsers,
      newMovies,
      newSeries,
      totalViews,
      totalSearches,
      totalDownloads,
      userActivity,
      topViewedMovies,
      topRatedMovies,
      genreDistribution,
      dailyStats,
    ] = await Promise.all([
      this.prisma.user.count({
        where: { createdAt: { gte: startDate } },
      }),
      this.prisma.movie.count({
        where: { createdAt: { gte: startDate } },
      }),
      this.prisma.series.count({
        where: { createdAt: { gte: startDate } },
      }),
      this.prisma.watchHistory.count({
        where: { lastWatched: { gte: startDate } },
      }),
      this.prisma.aISearchLog.count({
        where: { createdAt: { gte: startDate } },
      }),
      this.prisma.download.count({
        where: { createdAt: { gte: startDate } },
      }),
      this.prisma.watchHistory.groupBy({
        by: ['userId'],
        where: { lastWatched: { gte: startDate } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      this.prisma.movie.findMany({
        where: { isActive: true },
        orderBy: { viewCount: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          slug: true,
          poster: true,
          viewCount: true,
          rating: true,
        },
      }),
      this.prisma.movie.findMany({
        where: { isActive: true, ratingCount: { gt: 0 } },
        orderBy: { rating: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          slug: true,
          poster: true,
          rating: true,
          ratingCount: true,
        },
      }),
      this.prisma.movieGenre.groupBy({
        by: ['genreId'],
        _count: { movieId: true },
        orderBy: { _count: { movieId: 'desc' } },
      }),
      this.prisma.dailyStat.findMany({
        where: { date: { gte: startDate } },
        orderBy: { date: 'asc' },
      }),
    ]);

    const genreIds = genreDistribution.map((g) => g.genreId);
    const genreRecords =
      genreIds.length > 0
        ? this.prisma.genre.findMany({ where: { id: { in: genreIds } } })
        : [];
    const resolvedGenres = await genreRecords;
    const genreMap = new Map(resolvedGenres.map((g) => [g.id, g]));

    return {
      period: dto.period,
      startDate,
      endDate: now,
      newUsers,
      newMovies,
      newSeries,
      totalViews,
      totalSearches,
      totalDownloads,
      uniqueActiveUsers: userActivity.length,
      topViewedMovies,
      topRatedMovies,
      genreDistribution: genreDistribution.map((g) => ({
        genre: genreMap.get(g.genreId),
        count: g._count.movieId,
      })),
      dailyStats,
    };
  }

  async broadcastMessage(dto: BroadcastDto, adminId: string) {
    const broadcast = await this.prisma.broadcast.create({
      data: {
        adminId,
        title: dto.title,
        message: dto.message,
        mediaUrl: dto.mediaUrl,
        targetType: dto.targetType,
        targetIds: dto.targetIds ? JSON.parse(JSON.stringify(dto.targetIds)) : null,
        status: 'sending',
      },
    });

    let targetFilter: Prisma.UserWhereInput = { isActive: true, isBanned: false };

    if (dto.targetType === 'premium') {
      targetFilter = { ...targetFilter, isPremium: true };
    } else if (dto.targetType === 'specific' && dto.targetIds?.length) {
      targetFilter = { ...targetFilter, id: { in: dto.targetIds } };
    }

    const targetUsers = await this.prisma.user.findMany({
      where: targetFilter,
      select: { id: true },
    });

    const notificationData = targetUsers.map((user) => ({
      userId: user.id,
      type: 'system' as const,
      title: dto.title,
      body: dto.message,
      data: { broadcastId: broadcast.id, mediaUrl: dto.mediaUrl },
    }));

    if (notificationData.length > 0) {
      const batchSize = 500;
      for (let i = 0; i < notificationData.length; i += batchSize) {
        const batch = notificationData.slice(i, i + batchSize);
        await this.prisma.notification.createMany({ data: batch });
      }
    }

    const updatedBroadcast = await this.prisma.broadcast.update({
      where: { id: broadcast.id },
      data: {
        sent: targetUsers.length,
        status: 'completed',
      },
    });

    await this.logAdminAction(adminId, 'broadcast', broadcast.id, 'broadcast', {
      title: dto.title,
      targetType: dto.targetType,
      sent: targetUsers.length,
    });

    return updatedBroadcast;
  }

  async getBroadcastHistory(dto: GetBroadcastHistoryDto) {
    const where: Prisma.BroadcastWhereInput = {};

    const [data, total] = await Promise.all([
      this.prisma.broadcast.findMany({
        where,
        skip: dto.skip,
        take: dto.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          admin: {
            select: { id: true, username: true, firstName: true, avatar: true },
          },
        },
      }),
      this.prisma.broadcast.count({ where }),
    ]);

    return new PaginatedResponse(data, total, dto.page, dto.limit);
  }

  async bulkImportMovies(movies: BulkImportMovieDto[], adminId: string) {
    let imported = 0;
    let failed = 0;
    const errors: Array<{ index: number; title: string; error: string }> = [];

    const maxCode = await this.prisma.movie.findFirst({
      orderBy: { code: 'desc' },
      select: { code: true },
    });
    let nextCode = (maxCode?.code ?? 0) + 1;

    for (let i = 0; i < movies.length; i++) {
      const movieData = movies[i];
      try {
        const slug = await this.generateUniqueSlug(movieData.title);

        const data: Prisma.MovieCreateInput = {
          code: nextCode++,
          title: movieData.title,
          originalTitle: movieData.originalTitle,
          slug,
          description: movieData.description,
          year: movieData.year,
          duration: movieData.duration,
          ageRating: movieData.ageRating,
          quality: movieData.quality,
          poster: movieData.poster,
          backdrop: movieData.backdrop,
          imdbId: movieData.imdbId,
          tmdbId: movieData.tmdbId,
          genres: movieData.genres?.length
            ? { create: movieData.genres.map((genreId) => ({ genreId })) }
            : undefined,
          countries: movieData.countries?.length
            ? { create: movieData.countries.map((countryId) => ({ countryId })) }
            : undefined,
          languages: movieData.languages?.length
            ? {
                create: movieData.languages.map((languageId) => ({
                  languageId,
                  isOriginal: false,
                })),
              }
            : undefined,
          actors: movieData.actors?.length
            ? {
                create: movieData.actors.map((personId, index) => ({
                  personId,
                  order: index,
                })),
              }
            : undefined,
          directors: movieData.directors?.length
            ? {
                create: movieData.directors.map((personId) => ({ personId })),
              }
            : undefined,
          tags: movieData.tags?.length
            ? { create: movieData.tags.map((tag) => ({ tag })) }
            : undefined,
        };

        await this.prisma.movie.create({ data });
        imported++;
      } catch (error) {
        failed++;
        errors.push({
          index: i,
          title: movieData.title,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    await this.logAdminAction(adminId, 'bulk_import', null, 'movie', {
      imported,
      failed,
      total: movies.length,
    });

    return {
      total: movies.length,
      imported,
      failed,
      errors,
    };
  }

  async bulkExportMovies(includeInactive: boolean = false) {
    const where: Prisma.MovieWhereInput = includeInactive ? {} : { isActive: true };

    const movies = await this.prisma.movie.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        genres: { include: { genre: { select: { id: true, name: true } } } },
        countries: { include: { country: { select: { id: true, name: true } } } },
        languages: { include: { language: { select: { id: true, name: true } } } },
        actors: { include: { person: { select: { id: true, name: true } } } },
        directors: { include: { person: { select: { id: true, name: true } } } },
        tags: { select: { tag: true } },
      },
    });

    return {
      total: movies.length,
      exportedAt: new Date(),
      movies: movies.map((m) => ({
        code: m.code,
        title: m.title,
        originalTitle: m.originalTitle,
        slug: m.slug,
        description: m.description,
        year: m.year,
        duration: m.duration,
        ageRating: m.ageRating,
        quality: m.quality,
        resolution: m.resolution,
        fileSize: m.fileSize ? Number(m.fileSize) : null,
        format: m.format,
        poster: m.poster,
        backdrop: m.backdrop,
        imdbId: m.imdbId,
        tmdbId: m.tmdbId,
        rating: m.rating,
        ratingCount: m.ratingCount,
        viewCount: m.viewCount,
        downloadCount: m.downloadCount,
        likeCount: m.likeCount,
        dislikeCount: m.dislikeCount,
        isFeatured: m.isFeatured,
        isActive: m.isActive,
        genres: m.genres.map((g) => g.genre.name),
        countries: m.countries.map((c) => c.country.name),
        languages: m.languages.map((l) => l.language.name),
        actors: m.actors.map((a) => a.person.name),
        directors: m.directors.map((d) => d.person.name),
        tags: m.tags.map((t) => t.tag),
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
      })),
    };
  }

  async logAdminAction(
    adminId: string,
    action: string,
    targetId: string | null,
    targetType: string | null,
    details?: Record<string, any>,
  ) {
    return this.prisma.adminAction.create({
      data: {
        adminId,
        action,
        targetId,
        targetType,
        details: details ? JSON.parse(JSON.stringify(details)) : null,
      },
    });
  }

  async getAdminActions(dto: GetAdminActionsDto) {
    const where: Prisma.AdminActionWhereInput = {};

    if (dto.adminId) {
      where.adminId = dto.adminId;
    }
    if (dto.action) {
      where.action = { contains: dto.action, mode: 'insensitive' };
    }
    if (dto.targetType) {
      where.targetType = dto.targetType;
    }

    const [data, total] = await Promise.all([
      this.prisma.adminAction.findMany({
        where,
        skip: dto.skip,
        take: dto.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          admin: {
            select: { id: true, username: true, firstName: true, avatar: true },
          },
        },
      }),
      this.prisma.adminAction.count({ where }),
    ]);

    return new PaginatedResponse(data, total, dto.page, dto.limit);
  }

  async getSystemHealth() {
    const dbHealthy = await this.checkDatabaseHealth();
    const redisHealthy = await this.checkRedisHealth();
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    return {
      status: dbHealthy && redisHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime),
      database: {
        status: dbHealthy ? 'connected' : 'disconnected',
      },
      redis: {
        status: redisHealthy ? 'connected' : 'disconnected',
      },
      memory: {
        rss: Math.floor(memoryUsage.rss / 1024 / 1024),
        heapUsed: Math.floor(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.floor(memoryUsage.heapTotal / 1024 / 1024),
        external: Math.floor(memoryUsage.external / 1024 / 1024),
      },
      nodeVersion: process.version,
      platform: process.platform,
    };
  }

  async getServerStats() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      usersToday,
      usersThisWeek,
      usersThisMonth,
      totalUsers,
      activeUsers,
      bannedUsers,
      premiumUsers,
      moviesToday,
      moviesThisWeek,
      moviesThisMonth,
      totalMovies,
      totalSeries,
      totalReviews,
      totalFavorites,
      totalDownloads,
      recentActions,
    ] = await Promise.all([
      this.prisma.user.count({ where: { createdAt: { gte: startOfDay } } }),
      this.prisma.user.count({ where: { createdAt: { gte: startOfWeek } } }),
      this.prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true, isBanned: false } }),
      this.prisma.user.count({ where: { isBanned: true } }),
      this.prisma.user.count({ where: { isPremium: true } }),
      this.prisma.movie.count({
        where: { createdAt: { gte: startOfDay } },
      }),
      this.prisma.movie.count({
        where: { createdAt: { gte: startOfWeek } },
      }),
      this.prisma.movie.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      this.prisma.movie.count(),
      this.prisma.series.count(),
      this.prisma.review.count(),
      this.prisma.favorite.count(),
      this.prisma.download.count(),
      this.prisma.adminAction.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          admin: {
            select: { id: true, username: true, firstName: true },
          },
        },
      }),
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        banned: bannedUsers,
        premium: premiumUsers,
        newToday: usersToday,
        newThisWeek: usersThisWeek,
        newThisMonth: usersThisMonth,
      },
      movies: {
        total: totalMovies,
        newToday: moviesToday,
        newThisWeek: moviesThisWeek,
        newThisMonth: moviesThisMonth,
      },
      series: {
        total: totalSeries,
      },
      engagement: {
        totalReviews,
        totalFavorites,
        totalDownloads,
      },
      recentActions,
    };
  }

  async featureMovie(movieId: string, adminId: string) {
    const movie = await this.prisma.movie.findUnique({
      where: { id: movieId },
      select: { id: true, title: true, isFeatured: true },
    });

    if (!movie) {
      throw new NotFoundException('Movie not found');
    }

    if (movie.isFeatured) {
      throw new ConflictException('Movie is already featured');
    }

    const updated = await this.prisma.movie.update({
      where: { id: movieId },
      data: { isFeatured: true },
      select: { id: true, title: true, isFeatured: true },
    });

    await this.logAdminAction(adminId, 'movie_feature', movieId, 'movie', {
      title: movie.title,
    });

    return updated;
  }

  async unfeatureMovie(movieId: string, adminId: string) {
    const movie = await this.prisma.movie.findUnique({
      where: { id: movieId },
      select: { id: true, title: true, isFeatured: true },
    });

    if (!movie) {
      throw new NotFoundException('Movie not found');
    }

    if (!movie.isFeatured) {
      throw new BadRequestException('Movie is not featured');
    }

    const updated = await this.prisma.movie.update({
      where: { id: movieId },
      data: { isFeatured: false },
      select: { id: true, title: true, isFeatured: true },
    });

    await this.logAdminAction(adminId, 'movie_unfeature', movieId, 'movie', {
      title: movie.title,
    });

    return updated;
  }

  private async checkDatabaseHealth(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  private async checkRedisHealth(): Promise<boolean> {
    try {
      const client = this.redis.getClient();
      const pong = await client.ping();
      return pong === 'PONG';
    } catch {
      return false;
    }
  }

  private async generateUniqueSlug(title: string): Promise<string> {
    const baseSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');

    const existing = await this.prisma.movie.findFirst({
      where: { slug: baseSlug },
      select: { id: true },
    });

    if (!existing) {
      return baseSlug;
    }

    let counter = 1;
    let candidate = `${baseSlug}-${counter}`;
    while (
      await this.prisma.movie.findFirst({
        where: { slug: candidate },
        select: { id: true },
      })
    ) {
      counter++;
      candidate = `${baseSlug}-${counter}`;
    }

    return candidate;
  }
}
