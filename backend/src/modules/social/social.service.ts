import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service';
import { PaginationDto, PaginatedResponse } from '../../common/dto/pagination.dto';
import {
  CreateReviewDto,
  UpdateReviewDto,
  AddReactionDto,
  ReportReviewDto,
} from './dto/social.dto';

@Injectable()
export class SocialService {
  constructor(private readonly prisma: PrismaService) {}

  async createReview(userId: string, dto: CreateReviewDto, movieId?: string, seriesId?: string) {
    if (!movieId && !seriesId) {
      throw new BadRequestException('Either movieId or seriesId is required');
    }

    if (movieId) {
      const movie = await this.prisma.movie.findUnique({ where: { id: movieId } });
      if (!movie) throw new NotFoundException('Movie not found');

      const existingReview = await this.prisma.review.findFirst({
        where: { userId, movieId },
      });
      if (existingReview) {
        throw new BadRequestException('You already reviewed this movie');
      }
    }

    if (seriesId) {
      const series = await this.prisma.series.findUnique({ where: { id: seriesId } });
      if (!series) throw new NotFoundException('Series not found');

      const existingReview = await this.prisma.review.findFirst({
        where: { userId, seriesId },
      });
      if (existingReview) {
        throw new BadRequestException('You already reviewed this series');
      }
    }

    const review = await this.prisma.review.create({
      data: {
        userId,
        movieId: movieId ?? null,
        seriesId: seriesId ?? null,
        rating: dto.rating,
        title: dto.title,
        content: dto.content,
        spoiler: dto.spoiler ?? false,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            avatar: true,
            level: true,
          },
        },
      },
    });

    if (dto.rating && movieId) {
      await this.updateMovieRating(movieId);
    }

    if (dto.rating && seriesId) {
      await this.updateSeriesRating(seriesId);
    }

    return review;
  }

  async updateReview(userId: string, reviewId: string, dto: UpdateReviewDto) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('Not your review');
    }

    const updateData: Prisma.ReviewUpdateInput = {};
    if (dto.rating !== undefined) updateData.rating = dto.rating;
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.content !== undefined) updateData.content = dto.content;
    if (dto.spoiler !== undefined) updateData.spoiler = dto.spoiler;

    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            avatar: true,
            level: true,
          },
        },
      },
    });

    if (dto.rating !== undefined) {
      if (review.movieId) await this.updateMovieRating(review.movieId);
      if (review.seriesId) await this.updateSeriesRating(review.seriesId);
    }

    return updated;
  }

  async deleteReview(userId: string, reviewId: string) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('Not your review');
    }

    await this.prisma.review.delete({ where: { id: reviewId } });

    if (review.movieId) await this.updateMovieRating(review.movieId);
    if (review.seriesId) await this.updateSeriesRating(review.seriesId);

    return { deleted: true };
  }

  async getMovieReviews(
    movieId: string,
    dto: PaginationDto,
    sortBy: 'recent' | 'popular' | 'rating' = 'recent',
  ): Promise<PaginatedResponse<any>> {
    const movie = await this.prisma.movie.findUnique({ where: { id: movieId } });
    if (!movie) throw new NotFoundException('Movie not found');

    const where: Prisma.ReviewWhereInput = {
      movieId,
      isActive: true,
    };

    let orderBy: Prisma.ReviewOrderByWithRelationInput = {};
    switch (sortBy) {
      case 'popular':
        orderBy = { likes: 'desc' };
        break;
      case 'rating':
        orderBy = { rating: 'desc' };
        break;
      case 'recent':
      default:
        orderBy = { createdAt: 'desc' };
    }

    const [data, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip: dto.skip,
        take: dto.limit,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              avatar: true,
              level: true,
            },
          },
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    return new PaginatedResponse(data, total, dto.page, dto.limit);
  }

  async getSeriesReviews(
    seriesId: string,
    dto: PaginationDto,
    sortBy: 'recent' | 'popular' | 'rating' = 'recent',
  ): Promise<PaginatedResponse<any>> {
    const series = await this.prisma.series.findUnique({ where: { id: seriesId } });
    if (!series) throw new NotFoundException('Series not found');

    const where: Prisma.ReviewWhereInput = {
      seriesId,
      isActive: true,
    };

    let orderBy: Prisma.ReviewOrderByWithRelationInput = {};
    switch (sortBy) {
      case 'popular':
        orderBy = { likes: 'desc' };
        break;
      case 'rating':
        orderBy = { rating: 'desc' };
        break;
      case 'recent':
      default:
        orderBy = { createdAt: 'desc' };
    }

    const [data, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip: dto.skip,
        take: dto.limit,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              avatar: true,
              level: true,
            },
          },
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    return new PaginatedResponse(data, total, dto.page, dto.limit);
  }

  async toggleLikeReview(userId: string, reviewId: string) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    const existingLike = await this.prisma.$queryRaw<
      { id: string }[]
    >`SELECT id FROM "ReviewLike" WHERE "userId" = ${userId} AND "reviewId" = ${reviewId}`;

    if (existingLike.length > 0) {
      await this.prisma.$executeRaw`
        DELETE FROM "ReviewLike" WHERE "userId" = ${userId} AND "reviewId" = ${reviewId}
      `;
      await this.prisma.review.update({
        where: { id: reviewId },
        data: { likes: { decrement: 1 } },
      });
      return { liked: false, likes: review.likes - 1 };
    }

    await this.prisma.$executeRaw`
      INSERT INTO "ReviewLike" ("id", "userId", "reviewId", "createdAt")
      VALUES (gen_random_uuid(), ${userId}, ${reviewId}, NOW())
    `;
    await this.prisma.review.update({
      where: { id: reviewId },
      data: { likes: { increment: 1 } },
    });

    return { liked: true, likes: review.likes + 1 };
  }

  async addReaction(
    userId: string,
    dto: AddReactionDto,
    contentType: 'movie' | 'series',
    contentId: string,
  ) {
    if (contentType === 'movie') {
      const movie = await this.prisma.movie.findUnique({ where: { id: contentId } });
      if (!movie) throw new NotFoundException('Movie not found');

      const existing = await this.prisma.reaction.findFirst({
        where: { userId, movieId: contentId, emoji: dto.emoji },
      });

      if (existing) {
        await this.prisma.reaction.delete({ where: { id: existing.id } });
        return { reacted: false, emoji: dto.emoji };
      }

      const conflictingReaction = await this.prisma.reaction.findFirst({
        where: { userId, movieId: contentId },
      });

      if (conflictingReaction) {
        await this.prisma.reaction.delete({ where: { id: conflictingReaction.id } });
      }

      await this.prisma.reaction.create({
        data: {
          userId,
          movieId: contentId,
          emoji: dto.emoji,
        },
      });

      return { reacted: true, emoji: dto.emoji };
    }

    if (contentType === 'series') {
      const series = await this.prisma.series.findUnique({ where: { id: contentId } });
      if (!series) throw new NotFoundException('Series not found');

      const existing = await this.prisma.reaction.findFirst({
        where: { userId, seriesId: contentId, emoji: dto.emoji },
      });

      if (existing) {
        await this.prisma.reaction.delete({ where: { id: existing.id } });
        return { reacted: false, emoji: dto.emoji };
      }

      const conflictingReaction = await this.prisma.reaction.findFirst({
        where: { userId, seriesId: contentId },
      });

      if (conflictingReaction) {
        await this.prisma.reaction.delete({ where: { id: conflictingReaction.id } });
      }

      await this.prisma.reaction.create({
        data: {
          userId,
          seriesId: contentId,
          emoji: dto.emoji,
        },
      });

      return { reacted: true, emoji: dto.emoji };
    }
  }

  async getReactions(contentType: 'movie' | 'series', contentId: string) {
    const where: Prisma.ReactionWhereInput =
      contentType === 'movie'
        ? { movieId: contentId }
        : { seriesId: contentId };

    const reactions = await this.prisma.reaction.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const emojiCounts: Record<string, number> = {};
    for (const reaction of reactions) {
      emojiCounts[reaction.emoji] = (emojiCounts[reaction.emoji] || 0) + 1;
    }

    return {
      reactions,
      counts: emojiCounts,
      total: reactions.length,
    };
  }

  async reportReview(userId: string, reviewId: string, dto: ReportReviewDto) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId === userId) {
      throw new BadRequestException('Cannot report your own review');
    }

    const report = await this.prisma.report.create({
      data: {
        userId,
        movieId: review.movieId,
        seriesId: review.seriesId,
        reason: 'inappropriate',
        message: `[Review ${reviewId}] ${dto.reason}`,
      },
    });

    return { reported: true, reportId: report.id };
  }

  private async updateMovieRating(movieId: string) {
    const result = await this.prisma.review.aggregate({
      where: { movieId, isActive: true, rating: { not: null } },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await this.prisma.movie.update({
      where: { id: movieId },
      data: {
        rating: result._avg.rating ?? 0,
        ratingCount: result._count.rating,
      },
    });
  }

  private async updateSeriesRating(seriesId: string) {
    const result = await this.prisma.review.aggregate({
      where: { seriesId, isActive: true, rating: { not: null } },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await this.prisma.series.update({
      where: { id: seriesId },
      data: {
        rating: result._avg.rating ?? 0,
        ratingCount: result._count.rating,
      },
    });
  }
}
