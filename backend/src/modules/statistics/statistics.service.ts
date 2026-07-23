import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service';
import { RedisService } from '../../config/redis.service';
import { TrackViewDto } from './dto/statistics.dto';

@Injectable()
export class StatisticsService {
  private readonly logger = new Logger(StatisticsService.name);

  private readonly CACHE_TTL = 300;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getGlobalStats() {
    const cacheKey = 'stats:global';
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(now);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const [
      totalUsers,
      activeUsersToday,
      activeUsersWeek,
      totalMovies,
      activeMovies,
      totalSeries,
      totalViewsAgg,
      newUsersToday,
      newUsersWeek,
      premiumUsers,
      totalReviews,
      totalDownloads,
    ] = await Promise.all([
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.count({
        where: { isActive: true, watchHistory: { some: { lastWatched: { gte: todayStart } } } },
      }),
      this.prisma.user.count({
        where: { isActive: true, watchHistory: { some: { lastWatched: { gte: weekAgo } } } },
      }),
      this.prisma.movie.count(),
      this.prisma.movie.count({ where: { isActive: true } }),
      this.prisma.series.count({ where: { isActive: true } }),
      this.prisma.movie.aggregate({ _sum: { viewCount: true } }),
      this.prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
      this.prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      this.prisma.user.count({
        where: { isPremium: true, premiumUntil: { gt: now } },
      }),
      this.prisma.review.count({ where: { isActive: true } }),
      this.prisma.download.count(),
    ]);

    const topGenres = await this.prisma.genre.findMany({
      take: 10,
      include: {
        movies: {
          select: { movie: { select: { viewCount: true, rating: true } } },
        },
      },
    });

    const genreStats = topGenres.map((g) => {
      const totalMovieViews = g.movies.reduce(
        (sum, gm) => sum + (gm.movie?.viewCount ?? 0),
        0,
      );
      const avgRating =
        g.movies.length > 0
          ? g.movies.reduce((sum, gm) => sum + (gm.movie?.rating ?? 0), 0) / g.movies.length
          : 0;
      return {
        id: g.id,
        name: g.name,
        emoji: g.emoji,
        movieCount: g.movies.length,
        totalViews: totalMovieViews,
        avgRating: Math.round(avgRating * 10) / 10,
      };
    });

    genreStats.sort((a, b) => b.totalViews - a.totalViews);

    const result = {
      users: {
        total: totalUsers,
        activeToday: activeUsersToday,
        activeThisWeek: activeUsersWeek,
        newToday: newUsersToday,
        newThisWeek: newUsersWeek,
        premium: premiumUsers,
      },
      content: {
        totalMovies,
        activeMovies,
        totalSeries,
        totalReviews,
        totalDownloads,
      },
      views: {
        total: totalViewsAgg._sum.viewCount ?? 0,
      },
      topGenres,
      generatedAt: now.toISOString(),
    };

    await this.redis.set(cacheKey, JSON.stringify(result), this.CACHE_TTL);
    return result;
  }

  async getMovieStats(movieId: string) {
    const movie = await this.prisma.movie.findUnique({
      where: { id: movieId },
      select: {
        id: true,
        title: true,
        slug: true,
        viewCount: true,
        likeCount: true,
        dislikeCount: true,
        downloadCount: true,
        rating: true,
        ratingCount: true,
        createdAt: true,
      },
    });

    if (!movie) {
      throw new NotFoundException('Movie not found');
    }

    const [reviewStats, favoriteCount, watchHistoryCount, uniqueViewers] = await Promise.all([
      this.prisma.review.aggregate({
        where: { movieId, isActive: true },
        _avg: { rating: true },
        _count: { id: true },
        _sum: { likes: true },
      }),
      this.prisma.favorite.count({ where: { movieId } }),
      this.prisma.watchHistory.count({ where: { movieId } }),
      this.prisma.watchHistory.findMany({
        where: { movieId },
        select: { userId: true },
        distinct: ['userId'],
      }).then((records) => records.length),
    ]);

    const dailyViews = await this.prisma.watchHistory.groupBy({
      by: ['lastWatched'],
      where: {
        movieId,
        lastWatched: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      _count: { id: true },
      orderBy: { lastWatched: 'asc' },
    });

    return {
      movie,
      stats: {
        reviews: {
          count: reviewStats._count.id,
          avgRating: reviewStats._avg.rating
            ? Math.round(reviewStats._avg.rating * 10) / 10
            : 0,
          totalLikes: reviewStats._sum.likes ?? 0,
        },
        favorites: favoriteCount,
        uniqueViewers,
        watchSessions: watchHistoryCount,
      },
      dailyViews: dailyViews.map((d) => ({
        date: d.lastWatched.toISOString().split('T')[0],
        views: d._count.id,
      })),
    };
  }

  async getUserStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        firstName: true,
        level: true,
        xp: true,
        coins: true,
        isPremium: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [
      totalWatchHistory,
      favoriteCount,
      reviewCount,
      downloadsCount,
      achievementsCount,
      watchTimeAgg,
      uniqueMoviesWatched,
      uniqueSeriesWatched,
      recentActivity,
    ] = await Promise.all([
      this.prisma.watchHistory.count({ where: { userId } }),
      this.prisma.favorite.count({ where: { userId } }),
      this.prisma.review.count({ where: { userId } }),
      this.prisma.download.count({ where: { userId } }),
      this.prisma.userAchievement.count({ where: { userId } }),
      this.prisma.watchHistory.aggregate({
        where: { userId },
        _sum: { progress: true },
      }),
      this.prisma.watchHistory.findMany({
        where: { userId, movieId: { not: null } },
        select: { movieId: true },
        distinct: ['movieId'],
      }).then((r) => r.length),
      this.prisma.watchHistory.findMany({
        where: { userId, seriesId: { not: null } },
        select: { seriesId: true },
        distinct: ['seriesId'],
      }).then((r) => r.length),
      this.prisma.watchHistory.findMany({
        where: { userId },
        take: 10,
        orderBy: { lastWatched: 'desc' },
        include: {
          movie: { select: { id: true, title: true, poster: true } },
          series: { select: { id: true, title: true, poster: true } },
        },
      }),
    ]);

    const totalWatchMinutes = watchTimeAgg._sum.progress
      ? Math.round(watchTimeAgg._sum.progress / 60)
      : 0;

    const dailyStats = await this.prisma.userStatistic.findMany({
      where: {
        userId,
        date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { date: 'asc' },
    });

    return {
      user,
      stats: {
        totalWatchSessions: totalWatchHistory,
        totalWatchMinutes,
        uniqueMoviesWatched,
        uniqueSeriesWatched,
        favorites: favoriteCount,
        reviews: reviewCount,
        downloads: downloadsCount,
        achievements: achievementsCount,
      },
      recentActivity: recentActivity.map((h) => ({
        id: h.id,
        title: h.movie?.title ?? h.series?.title ?? 'Unknown',
        poster: h.movie?.poster ?? h.series?.poster,
        progress: h.progress,
        duration: h.duration,
        completed: h.completed,
        lastWatched: h.lastWatched,
      })),
      dailyStats: dailyStats.map((s) => ({
        date: s.date.toISOString().split('T')[0],
        watchTime: s.watchTime,
        moviesWatched: s.moviesWatched,
        searchCount: s.searchCount,
        xpEarned: s.xpEarned,
      })),
    };
  }

  async getDailyStats(startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    end.setHours(23, 59, 59, 999);

    const stats = await this.prisma.dailyStat.findMany({
      where: {
        date: { gte: start, lte: end },
      },
      orderBy: { date: 'asc' },
    });

    const summary = stats.reduce(
      (acc, s) => ({
        totalUsers: acc.totalUsers + s.totalUsers,
        totalActiveUsers: acc.totalActiveUsers + s.activeUsers,
        totalNewUsers: acc.totalNewUsers + s.newUsers,
        totalViews: acc.totalViews + s.totalViews,
        totalSearches: acc.totalSearches + s.totalSearches,
        totalDownloads: acc.totalDownloads + s.totalDownloads,
        days: acc.days + 1,
      }),
      {
        totalUsers: 0,
        totalActiveUsers: 0,
        totalNewUsers: 0,
        totalViews: 0,
        totalSearches: 0,
        totalDownloads: 0,
        days: 0,
      },
    );

    return {
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      summary: {
        avgActiveUsers: summary.days > 0 ? Math.round(summary.totalActiveUsers / summary.days) : 0,
        avgViews: summary.days > 0 ? Math.round(summary.totalViews / summary.days) : 0,
        avgSearches: summary.days > 0 ? Math.round(summary.totalSearches / summary.days) : 0,
        totalNewUsers: summary.totalNewUsers,
      },
      daily: stats.map((s) => ({
        date: s.date.toISOString().split('T')[0],
        totalUsers: s.totalUsers,
        activeUsers: s.activeUsers,
        newUsers: s.newUsers,
        totalViews: s.totalViews,
        totalSearches: s.totalSearches,
        totalDownloads: s.totalDownloads,
        topGenres: s.topGenres,
        topMovies: s.topMovies,
        topCountries: s.topCountries,
      })),
    };
  }

  async getCountryStats() {
    const cacheKey = 'stats:countries';
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const countries = await this.prisma.country.findMany({
      include: {
        movies: {
          select: {
            movie: {
              select: { viewCount: true, rating: true, likeCount: true },
            },
          },
        },
      },
    });

    const countryStats = countries.map((c) => {
      const movieCount = c.movies.length;
      const totalViews = c.movies.reduce(
        (sum, cm) => sum + (cm.movie?.viewCount ?? 0),
        0,
      );
      const avgRating =
        movieCount > 0
          ? c.movies.reduce((sum, cm) => sum + (cm.movie?.rating ?? 0), 0) / movieCount
          : 0;
      const totalLikes = c.movies.reduce(
        (sum, cm) => sum + (cm.movie?.likeCount ?? 0),
        0,
      );

      return {
        id: c.id,
        name: c.name,
        code: c.code,
        flag: c.flag,
        movieCount,
        totalViews,
        totalLikes,
        avgRating: Math.round(avgRating * 10) / 10,
      };
    });

    countryStats.sort((a, b) => b.totalViews - a.totalViews);

    await this.redis.set(cacheKey, JSON.stringify(countryStats), this.CACHE_TTL);
    return countryStats;
  }

  async getDeviceStats() {
    const sessions = await this.prisma.loginHistory.groupBy({
      by: ['platform', 'device'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    const platformBreakdown: Record<string, number> = {};
    const deviceBreakdown: Record<string, number> = {};

    for (const s of sessions) {
      const platform = s.platform ?? 'unknown';
      const device = s.device ?? 'unknown';

      platformBreakdown[platform] = (platformBreakdown[platform] ?? 0) + s._count.id;
      deviceBreakdown[device] = (deviceBreakdown[device] ?? 0) + s._count.id;
    }

    const totalSessions = Object.values(platformBreakdown).reduce((a, b) => a + b, 0);

    return {
      totalSessions,
      platforms: Object.entries(platformBreakdown)
        .map(([name, count]) => ({
          name,
          count,
          percentage: totalSessions > 0 ? Math.round((count / totalSessions) * 1000) / 10 : 0,
        }))
        .sort((a, b) => b.count - a.count),
      devices: Object.entries(deviceBreakdown)
        .map(([name, count]) => ({
          name,
          count,
          percentage: totalSessions > 0 ? Math.round((count / totalSessions) * 1000) / 10 : 0,
        }))
        .sort((a, b) => b.count - a.count),
    };
  }

  async trackView(dto: TrackViewDto) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (dto.entityType === 'movie') {
      const movie = await this.prisma.movie.findUnique({
        where: { id: dto.entityId },
        select: { id: true },
      });
      if (!movie) throw new NotFoundException('Movie not found');

      await this.prisma.movie.update({
        where: { id: dto.entityId },
        data: { viewCount: { increment: 1 } },
      });

      if (dto.userId) {
        const existing = await this.prisma.userStatistic.findUnique({
          where: { userId_date: { userId: dto.userId, date: todayStart } },
        });

        if (existing) {
          await this.prisma.userStatistic.update({
            where: { id: existing.id },
            data: { moviesWatched: { increment: 1 } },
          });
        } else {
          await this.prisma.userStatistic.create({
            data: {
              userId: dto.userId,
              date: todayStart,
              moviesWatched: 1,
            },
          });
        }
      }
    }

    if (dto.entityType === 'series') {
      const series = await this.prisma.series.findUnique({
        where: { id: dto.entityId },
        select: { id: true },
      });
      if (!series) throw new NotFoundException('Series not found');

      await this.prisma.series.update({
        where: { id: dto.entityId },
        data: { viewCount: { increment: 1 } },
      });
    }

    if (dto.userId) {
      const existingDailyStat = await this.prisma.dailyStat.findUnique({
        where: { date: todayStart },
      });

      if (existingDailyStat) {
        await this.prisma.dailyStat.update({
          where: { id: existingDailyStat.id },
          data: { totalViews: { increment: 1 } },
        });
      } else {
        await this.prisma.dailyStat.create({
          data: {
            date: todayStart,
            totalViews: 1,
            totalUsers: 1,
          },
        });
      }
    }

    if (dto.country) {
      await this.redis.incr(`stats:country:${dto.country}:views`);
    }
    if (dto.device) {
      await this.redis.incr(`stats:device:${dto.device}:views`);
    }

    await this.redis.del('stats:global');

    return { tracked: true, entityType: dto.entityType, entityId: dto.entityId };
  }
}
