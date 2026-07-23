import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service';
import { PaginationDto, PaginatedResponse } from '../../common/dto/pagination.dto';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async toggleFavorite(userId: string, movieId: string) {
    const movie = await this.prisma.movie.findUnique({ where: { id: movieId } });
    if (!movie) {
      throw new NotFoundException('Movie not found');
    }

    const existing = await this.prisma.favorite.findUnique({
      where: { userId_movieId: { userId, movieId } },
    });

    if (existing) {
      await this.prisma.favorite.delete({ where: { id: existing.id } });
      return { favorited: false, message: 'Movie removed from favorites' };
    }

    await this.prisma.favorite.create({
      data: { userId, movieId },
    });

    return { favorited: true, message: 'Movie added to favorites' };
  }

  async toggleSeriesFavorite(userId: string, seriesId: string) {
    const series = await this.prisma.series.findUnique({ where: { id: seriesId } });
    if (!series) {
      throw new NotFoundException('Series not found');
    }

    const existing = await this.prisma.favorite.findUnique({
      where: { userId_seriesId: { userId, seriesId } },
    });

    if (existing) {
      await this.prisma.favorite.delete({ where: { id: existing.id } });
      return { favorited: false, message: 'Series removed from favorites' };
    }

    await this.prisma.favorite.create({
      data: { userId, seriesId },
    });

    return { favorited: true, message: 'Series added to favorites' };
  }

  async getUserFavorites(
    userId: string,
    dto: PaginationDto,
  ): Promise<PaginatedResponse<any>> {
    const where: Prisma.FavoriteWhereInput = { userId };

    const [data, total] = await Promise.all([
      this.prisma.favorite.findMany({
        where,
        skip: dto.skip,
        take: dto.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          movie: {
            include: {
              genres: { include: { genre: { select: { id: true, name: true, slug: true, emoji: true } } } },
              countries: { include: { country: { select: { id: true, name: true, code: true, flag: true } } } },
            },
          },
          series: {
            include: {
              genres: { include: { genre: { select: { id: true, name: true, slug: true, emoji: true } } } },
              countries: { include: { country: { select: { id: true, name: true, code: true, flag: true } } } },
            },
          },
        },
      }),
      this.prisma.favorite.count({ where }),
    ]);

    return new PaginatedResponse(data, total, dto.page, dto.limit);
  }

  async isFavorited(userId: string, movieId: string): Promise<boolean> {
    const existing = await this.prisma.favorite.findUnique({
      where: { userId_movieId: { userId, movieId } },
      select: { id: true },
    });
    return !!existing;
  }

  async getFavoritesCount(userId: string): Promise<number> {
    return this.prisma.favorite.count({ where: { userId } });
  }
}
