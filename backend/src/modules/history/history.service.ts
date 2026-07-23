import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service';
import { PaginationDto, PaginatedResponse } from '../../common/dto/pagination.dto';

@Injectable()
export class HistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async updateProgress(
    userId: string,
    dto: {
      movieId?: string;
      episodeId?: string;
      progress: number;
      duration: number;
    },
  ) {
    if (!dto.movieId && !dto.episodeId) {
      throw new BadRequestException('Either movieId or episodeId is required');
    }

    if (dto.movieId) {
      const movie = await this.prisma.movie.findUnique({ where: { id: dto.movieId } });
      if (!movie) throw new NotFoundException('Movie not found');
    }

    if (dto.episodeId) {
      const episode = await this.prisma.episode.findUnique({ where: { id: dto.episodeId } });
      if (!episode) throw new NotFoundException('Episode not found');
    }

    const completed = dto.duration > 0 && dto.progress >= dto.duration * 0.9;

    if (dto.movieId) {
      const existing = await this.prisma.watchHistory.findUnique({
        where: { userId_movieId: { userId, movieId: dto.movieId } },
      });

      if (existing) {
        return this.prisma.watchHistory.update({
          where: { id: existing.id },
          data: {
            progress: dto.progress,
            duration: dto.duration,
            completed,
            lastWatched: new Date(),
          },
        });
      }

      return this.prisma.watchHistory.create({
        data: {
          userId,
          movieId: dto.movieId,
          progress: dto.progress,
          duration: dto.duration,
          completed,
        },
      });
    }

    if (dto.episodeId) {
      const existing = await this.prisma.watchHistory.findUnique({
        where: { userId_episodeId: { userId, episodeId: dto.episodeId } },
      });

      if (existing) {
        return this.prisma.watchHistory.update({
          where: { id: existing.id },
          data: {
            progress: dto.progress,
            duration: dto.duration,
            completed,
            lastWatched: new Date(),
          },
        });
      }

      return this.prisma.watchHistory.create({
        data: {
          userId,
          episodeId: dto.episodeId,
          progress: dto.progress,
          duration: dto.duration,
          completed,
        },
      });
    }
  }

  async getWatchHistory(
    userId: string,
    dto: PaginationDto,
  ): Promise<PaginatedResponse<any>> {
    const where: Prisma.WatchHistoryWhereInput = { userId };

    const [data, total] = await Promise.all([
      this.prisma.watchHistory.findMany({
        where,
        skip: dto.skip,
        take: dto.limit,
        orderBy: { lastWatched: 'desc' },
        include: {
          movie: {
            select: {
              id: true,
              title: true,
              slug: true,
              poster: true,
              backdrop: true,
              year: true,
              duration: true,
              rating: true,
              quality: true,
            },
          },
          episode: {
            select: {
              id: true,
              title: true,
              number: true,
              duration: true,
              season: {
                select: {
                  id: true,
                  number: true,
                  title: true,
                  series: {
                    select: {
                      id: true,
                      title: true,
                      slug: true,
                      poster: true,
                      backdrop: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.watchHistory.count({ where }),
    ]);

    return new PaginatedResponse(data, total, dto.page, dto.limit);
  }

  async getContinueWatching(userId: string) {
    const items = await this.prisma.watchHistory.findMany({
      where: {
        userId,
        completed: false,
        progress: { gt: 0 },
      },
      orderBy: { lastWatched: 'desc' },
      take: 20,
      include: {
        movie: {
          select: {
            id: true,
            title: true,
            slug: true,
            poster: true,
            backdrop: true,
            year: true,
            duration: true,
            rating: true,
            quality: true,
          },
        },
        episode: {
          select: {
            id: true,
            title: true,
            number: true,
            duration: true,
            season: {
              select: {
                id: true,
                number: true,
                title: true,
                series: {
                  select: {
                    id: true,
                    title: true,
                    slug: true,
                    poster: true,
                    backdrop: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return items.filter((item) => {
      const duration = item.duration || 0;
      if (duration <= 0) return true;
      const percentWatched = (item.progress / duration) * 100;
      return percentWatched < 90;
    });
  }

  async removeFromHistory(userId: string, historyId: string) {
    const history = await this.prisma.watchHistory.findUnique({
      where: { id: historyId },
    });

    if (!history) {
      throw new NotFoundException('History entry not found');
    }

    if (history.userId !== userId) {
      throw new BadRequestException('Not your history entry');
    }

    await this.prisma.watchHistory.delete({ where: { id: historyId } });
    return { deleted: true };
  }

  async clearHistory(userId: string) {
    const result = await this.prisma.watchHistory.deleteMany({
      where: { userId },
    });
    return { deleted: result.count };
  }

  async getWatchStats(userId: string) {
    const [totalEntries, completedEntries, aggregateResult, moviesCount, episodesCount] =
      await Promise.all([
        this.prisma.watchHistory.count({ where: { userId } }),
        this.prisma.watchHistory.count({ where: { userId, completed: true } }),
        this.prisma.watchHistory.aggregate({
          where: { userId },
          _sum: { progress: true, duration: true },
        }),
        this.prisma.watchHistory.count({ where: { userId, movieId: { not: null } } }),
        this.prisma.watchHistory.count({ where: { userId, episodeId: { not: null } } }),
      ]);

    const totalWatchTimeSeconds = aggregateResult._sum.progress ?? 0;
    const totalDurationSeconds = aggregateResult._sum.duration ?? 0;

    return {
      totalEntries,
      completedEntries,
      totalWatchTimeSeconds,
      totalWatchTimeMinutes: Math.floor(totalWatchTimeSeconds / 60),
      totalWatchTimeHours: Math.floor(totalWatchTimeSeconds / 3600),
      totalDurationSeconds,
      moviesWatched: moviesCount,
      seriesWatched: episodesCount,
      completionRate:
        totalEntries > 0 ? Math.round((completedEntries / totalEntries) * 100) : 0,
    };
  }
}
