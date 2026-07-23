import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service';
import { PaginationDto, PaginatedResponse } from '../../common/dto/pagination.dto';
import { CreateMovieDto, UpdateMovieDto, FilterMovieDto } from './dto/movies.dto';

const MOVIE_INCLUDE: Prisma.MovieInclude = {
  genres: { include: { genre: true } },
  countries: { include: { country: true } },
  languages: { include: { language: true } },
  actors: { include: { person: true }, orderBy: { order: 'asc' } },
  directors: { include: { person: true } },
  screenshots: { orderBy: { order: 'asc' } },
  subtitles: { include: { language: true } },
  tags: true,
};

@Injectable()
export class MoviesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    dto: PaginationDto,
    filters?: FilterMovieDto,
  ): Promise<PaginatedResponse<any>> {
    const where: Prisma.MovieWhereInput = {
      isActive: true,
    };

    if (filters) {
      if (filters.genre) {
        where.genres = { some: { genreId: filters.genre } };
      }
      if (filters.year) {
        where.year = filters.year;
      }
      if (filters.country) {
        where.countries = { some: { countryId: filters.country } };
      }
      if (filters.language) {
        where.languages = { some: { languageId: filters.language } };
      }
      if (filters.quality) {
        where.quality = filters.quality;
      }
      if (filters.ageRating) {
        where.ageRating = filters.ageRating;
      }
      if (filters.isFeatured !== undefined) {
        where.isFeatured = filters.isFeatured;
      }
    }

    if (dto.search) {
      where.OR = [
        { title: { contains: dto.search, mode: 'insensitive' } },
        { originalTitle: { contains: dto.search, mode: 'insensitive' } },
        { description: { contains: dto.search, mode: 'insensitive' } },
        { tags: { some: { tag: { contains: dto.search, mode: 'insensitive' } } } },
      ];
    }

    const orderBy: Prisma.MovieOrderByWithRelationInput = {};
    const sortBy = filters?.sortBy || dto.sortBy;
    const sortOrder = filters?.sortOrder || dto.sortOrder;

    if (sortBy && sortBy in ['createdAt', 'year', 'rating', 'viewCount', 'title']) {
      orderBy[sortBy as keyof Prisma.MovieOrderByWithRelationInput] = sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    const [data, total] = await Promise.all([
      this.prisma.movie.findMany({
        where,
        skip: dto.skip,
        take: dto.limit,
        orderBy,
        include: {
          genres: { include: { genre: { select: { id: true, name: true, slug: true, emoji: true } } } },
          countries: { include: { country: { select: { id: true, name: true, code: true, flag: true } } } },
        },
      }),
      this.prisma.movie.count({ where }),
    ]);

    return new PaginatedResponse(data, total, dto.page, dto.limit);
  }

  async findById(id: string) {
    const movie = await this.prisma.movie.findUnique({
      where: { id },
      include: MOVIE_INCLUDE,
    });

    if (!movie) {
      throw new NotFoundException('Movie not found');
    }

    return movie;
  }

  async findByCode(code: number) {
    const movie = await this.prisma.movie.findUnique({
      where: { code },
      include: MOVIE_INCLUDE,
    });

    if (!movie) {
      throw new NotFoundException(`Movie with code ${code} not found`);
    }

    return movie;
  }

  async findBySlug(slug: string) {
    const movie = await this.prisma.movie.findUnique({
      where: { slug },
      include: MOVIE_INCLUDE,
    });

    if (!movie) {
      throw new NotFoundException(`Movie with slug "${slug}" not found`);
    }

    return movie;
  }

  async search(query: string, dto: PaginationDto): Promise<PaginatedResponse<any>> {
    if (!query || query.trim().length === 0) {
      throw new BadRequestException('Search query is required');
    }

    const where: Prisma.MovieWhereInput = {
      isActive: true,
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { originalTitle: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { tags: { some: { tag: { contains: query, mode: 'insensitive' } } } },
      ],
    };

    const [data, total] = await Promise.all([
      this.prisma.movie.findMany({
        where,
        skip: dto.skip,
        take: dto.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          genres: { include: { genre: { select: { id: true, name: true, slug: true, emoji: true } } } },
          countries: { include: { country: { select: { id: true, name: true, code: true, flag: true } } } },
        },
      }),
      this.prisma.movie.count({ where }),
    ]);

    return new PaginatedResponse(data, total, dto.page, dto.limit);
  }

  async create(dto: CreateMovieDto) {
    const existingSlug = await this.prisma.movie.findFirst({
      where: { slug: await this.generateSlug(dto.title) },
    });

    const slug = existingSlug
      ? `${await this.generateSlug(dto.title)}-${Date.now()}`
      : await this.generateSlug(dto.title);

    const maxCode = await this.prisma.movie.findFirst({
      orderBy: { code: 'desc' },
      select: { code: true },
    });
    const nextCode = (maxCode?.code ?? 0) + 1;

    const data: Prisma.MovieCreateInput = {
      code: nextCode,
      title: dto.title,
      originalTitle: dto.originalTitle,
      slug,
      description: dto.description,
      year: dto.year,
      duration: dto.duration,
      ageRating: dto.ageRating,
      quality: dto.quality,
      resolution: dto.resolution,
      fileSize: dto.fileSize ? BigInt(Math.floor(dto.fileSize)) : undefined,
      format: dto.format,
      poster: dto.poster,
      backdrop: dto.backdrop,
      trailer: dto.trailer,
      telegramFileId: dto.telegramFileId,
      cloudUrl: dto.cloudUrl,
      imdbId: dto.imdbId,
      tmdbId: dto.tmdbId,
      isFeatured: dto.isFeatured ?? false,
      genres: {
        create: dto.genres.map((genreId) => ({ genreId })),
      },
      countries: {
        create: dto.countries.map((countryId) => ({ countryId })),
      },
      languages: {
        create: dto.languages.map((languageId) => ({
          languageId,
          isOriginal: false,
        })),
      },
      actors: dto.actors
        ? {
            create: dto.actors.map((personId, index) => ({
              personId,
              order: index,
            })),
          }
        : undefined,
      directors: dto.directors
        ? {
            create: dto.directors.map((personId) => ({ personId })),
          }
        : undefined,
      tags: dto.tags
        ? {
            create: dto.tags.map((tag) => ({ tag })),
          }
        : undefined,
    };

    return this.prisma.movie.create({
      data,
      include: MOVIE_INCLUDE,
    });
  }

  async update(id: string, dto: UpdateMovieDto) {
    const existing = await this.findById(id);

    const updateData: Prisma.MovieUpdateInput = {};

    if (dto.title !== undefined) {
      updateData.title = dto.title;
      if (dto.title !== existing.title) {
        const newSlug = await this.generateSlug(dto.title);
        const slugConflict = await this.prisma.movie.findFirst({
          where: { slug: newSlug, id: { not: id } },
        });
        updateData.slug = slugConflict ? `${newSlug}-${Date.now()}` : newSlug;
      }
    }
    if (dto.originalTitle !== undefined) updateData.originalTitle = dto.originalTitle;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.year !== undefined) updateData.year = dto.year;
    if (dto.duration !== undefined) updateData.duration = dto.duration;
    if (dto.ageRating !== undefined) updateData.ageRating = dto.ageRating;
    if (dto.quality !== undefined) updateData.quality = dto.quality;
    if (dto.resolution !== undefined) updateData.resolution = dto.resolution;
    if (dto.fileSize !== undefined) updateData.fileSize = BigInt(Math.floor(dto.fileSize));
    if (dto.format !== undefined) updateData.format = dto.format;
    if (dto.poster !== undefined) updateData.poster = dto.poster;
    if (dto.backdrop !== undefined) updateData.backdrop = dto.backdrop;
    if (dto.trailer !== undefined) updateData.trailer = dto.trailer;
    if (dto.telegramFileId !== undefined) updateData.telegramFileId = dto.telegramFileId;
    if (dto.cloudUrl !== undefined) updateData.cloudUrl = dto.cloudUrl;
    if (dto.imdbId !== undefined) updateData.imdbId = dto.imdbId;
    if (dto.tmdbId !== undefined) updateData.tmdbId = dto.tmdbId;
    if (dto.isFeatured !== undefined) updateData.isFeatured = dto.isFeatured;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    if (dto.genres) {
      await this.prisma.movieGenre.deleteMany({ where: { movieId: id } });
      updateData.genres = {
        create: dto.genres.map((genreId) => ({ genreId })),
      };
    }

    if (dto.countries) {
      await this.prisma.movieCountry.deleteMany({ where: { movieId: id } });
      updateData.countries = {
        create: dto.countries.map((countryId) => ({ countryId })),
      };
    }

    if (dto.languages) {
      await this.prisma.movieLanguage.deleteMany({ where: { movieId: id } });
      updateData.languages = {
        create: dto.languages.map((languageId) => ({
          languageId,
          isOriginal: false,
        })),
      };
    }

    if (dto.actors) {
      await this.prisma.movieActor.deleteMany({ where: { movieId: id } });
      updateData.actors = {
        create: dto.actors.map((personId, index) => ({
          personId,
          order: index,
        })),
      };
    }

    if (dto.directors) {
      await this.prisma.movieDirector.deleteMany({ where: { movieId: id } });
      updateData.directors = {
        create: dto.directors.map((personId) => ({ personId })),
      };
    }

    if (dto.tags) {
      await this.prisma.movieTag.deleteMany({ where: { movieId: id } });
      updateData.tags = {
        create: dto.tags.map((tag) => ({ tag })),
      };
    }

    return this.prisma.movie.update({
      where: { id },
      data: updateData,
      include: MOVIE_INCLUDE,
    });
  }

  async delete(id: string) {
    const movie = await this.findById(id);

    return this.prisma.movie.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, title: true, isActive: true },
    });
  }

  async getTrending(limit: number = 20) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const data = await this.prisma.movie.findMany({
      where: {
        isActive: true,
        createdAt: { gte: sevenDaysAgo },
      },
      take: limit,
      orderBy: { viewCount: 'desc' },
      include: {
        genres: { include: { genre: { select: { id: true, name: true, slug: true, emoji: true } } } },
        countries: { include: { country: { select: { id: true, name: true, code: true, flag: true } } } },
      },
    });

    if (data.length < limit) {
      const remaining = limit - data.length;
      const olderMovies = await this.prisma.movie.findMany({
        where: {
          isActive: true,
          id: { notIn: data.map((m) => m.id) },
        },
        take: remaining,
        orderBy: { viewCount: 'desc' },
        include: {
          genres: { include: { genre: { select: { id: true, name: true, slug: true, emoji: true } } } },
          countries: { include: { country: { select: { id: true, name: true, code: true, flag: true } } } },
        },
      });
      data.push(...olderMovies);
    }

    return data;
  }

  async getNewReleases(limit: number = 20) {
    return this.prisma.movie.findMany({
      where: { isActive: true },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        genres: { include: { genre: { select: { id: true, name: true, slug: true, emoji: true } } } },
        countries: { include: { country: { select: { id: true, name: true, code: true, flag: true } } } },
      },
    });
  }

  async getTopRated(limit: number = 20) {
    return this.prisma.movie.findMany({
      where: {
        isActive: true,
        ratingCount: { gt: 0 },
      },
      take: limit,
      orderBy: { rating: 'desc' },
      include: {
        genres: { include: { genre: { select: { id: true, name: true, slug: true, emoji: true } } } },
        countries: { include: { country: { select: { id: true, name: true, code: true, flag: true } } } },
      },
    });
  }

  async getRandom() {
    const count = await this.prisma.movie.count({
      where: { isActive: true },
    });

    if (count === 0) {
      throw new NotFoundException('No movies available');
    }

    const skip = Math.floor(Math.random() * count);

    const [movie] = await this.prisma.movie.findMany({
      where: { isActive: true },
      skip,
      take: 1,
      include: MOVIE_INCLUDE,
    });

    return movie;
  }

  async getByGenre(genreId: string, dto: PaginationDto): Promise<PaginatedResponse<any>> {
    const where: Prisma.MovieWhereInput = {
      isActive: true,
      genres: { some: { genreId } },
    };

    const [data, total] = await Promise.all([
      this.prisma.movie.findMany({
        where,
        skip: dto.skip,
        take: dto.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          genres: { include: { genre: { select: { id: true, name: true, slug: true, emoji: true } } } },
          countries: { include: { country: { select: { id: true, name: true, code: true, flag: true } } } },
        },
      }),
      this.prisma.movie.count({ where }),
    ]);

    return new PaginatedResponse(data, total, dto.page, dto.limit);
  }

  async getByYear(year: number, dto: PaginationDto): Promise<PaginatedResponse<any>> {
    const where: Prisma.MovieWhereInput = {
      isActive: true,
      year,
    };

    const [data, total] = await Promise.all([
      this.prisma.movie.findMany({
        where,
        skip: dto.skip,
        take: dto.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          genres: { include: { genre: { select: { id: true, name: true, slug: true, emoji: true } } } },
          countries: { include: { country: { select: { id: true, name: true, code: true, flag: true } } } },
        },
      }),
      this.prisma.movie.count({ where }),
    ]);

    return new PaginatedResponse(data, total, dto.page, dto.limit);
  }

  async getByCountry(countryId: string, dto: PaginationDto): Promise<PaginatedResponse<any>> {
    const where: Prisma.MovieWhereInput = {
      isActive: true,
      countries: { some: { countryId } },
    };

    const [data, total] = await Promise.all([
      this.prisma.movie.findMany({
        where,
        skip: dto.skip,
        take: dto.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          genres: { include: { genre: { select: { id: true, name: true, slug: true, emoji: true } } } },
          countries: { include: { country: { select: { id: true, name: true, code: true, flag: true } } } },
        },
      }),
      this.prisma.movie.count({ where }),
    ]);

    return new PaginatedResponse(data, total, dto.page, dto.limit);
  }

  async incrementView(movieId: string) {
    const movie = await this.findById(movieId);

    return this.prisma.movie.update({
      where: { id: movieId },
      data: { viewCount: { increment: 1 } },
      select: { id: true, viewCount: true },
    });
  }

  async likeMovie(userId: string, movieId: string) {
    const movie = await this.findById(movieId);

    const existingLike = await this.prisma.reaction.findFirst({
      where: {
        userId,
        movieId,
        emoji: '👍',
      },
    });

    if (existingLike) {
      await this.prisma.reaction.delete({
        where: { id: existingLike.id },
      });
      await this.prisma.movie.update({
        where: { id: movieId },
        data: { likeCount: { decrement: 1 } },
      });
      return { liked: false, likeCount: movie.likeCount - 1 };
    }

    const existingDislike = await this.prisma.reaction.findFirst({
      where: {
        userId,
        movieId,
        emoji: '👎',
      },
    });

    if (existingDislike) {
      await this.prisma.reaction.delete({
        where: { id: existingDislike.id },
      });
      await this.prisma.movie.update({
        where: { id: movieId },
        data: { dislikeCount: { decrement: 1 } },
      });
    }

    await this.prisma.reaction.create({
      data: {
        userId,
        movieId,
        emoji: '👍',
      },
    });

    await this.prisma.movie.update({
      where: { id: movieId },
      data: { likeCount: { increment: 1 } },
    });

    return { liked: true, likeCount: movie.likeCount + 1 };
  }

  async dislikeMovie(userId: string, movieId: string) {
    const movie = await this.findById(movieId);

    const existingDislike = await this.prisma.reaction.findFirst({
      where: {
        userId,
        movieId,
        emoji: '👎',
      },
    });

    if (existingDislike) {
      await this.prisma.reaction.delete({
        where: { id: existingDislike.id },
      });
      await this.prisma.movie.update({
        where: { id: movieId },
        data: { dislikeCount: { decrement: 1 } },
      });
      return { disliked: false, dislikeCount: movie.dislikeCount - 1 };
    }

    const existingLike = await this.prisma.reaction.findFirst({
      where: {
        userId,
        movieId,
        emoji: '👍',
      },
    });

    if (existingLike) {
      await this.prisma.reaction.delete({
        where: { id: existingLike.id },
      });
      await this.prisma.movie.update({
        where: { id: movieId },
        data: { likeCount: { decrement: 1 } },
      });
    }

    await this.prisma.reaction.create({
      data: {
        userId,
        movieId,
        emoji: '👎',
      },
    });

    await this.prisma.movie.update({
      where: { id: movieId },
      data: { dislikeCount: { increment: 1 } },
    });

    return { disliked: true, dislikeCount: movie.dislikeCount + 1 };
  }

  async generateSlug(title: string): Promise<string> {
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
    while (await this.prisma.movie.findFirst({ where: { slug: candidate }, select: { id: true } })) {
      counter++;
      candidate = `${baseSlug}-${counter}`;
    }

    return candidate;
  }

  async getNextCode(): Promise<number> {
    const maxCode = await this.prisma.movie.findFirst({
      orderBy: { code: 'desc' },
      select: { code: true },
    });
    return (maxCode?.code ?? 0) + 1;
  }
}
