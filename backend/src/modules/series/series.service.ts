import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service';
import { PaginationDto, PaginatedResponse } from '../../common/dto/pagination.dto';
import {
  CreateSeriesDto,
  UpdateSeriesDto,
  FilterSeriesDto,
  CreateSeasonDto,
  CreateEpisodeDto,
  UpdateEpisodeDto,
} from './dto/series.dto';

const SERIES_INCLUDE: Prisma.SeriesInclude = {
  genres: { include: { genre: true } },
  countries: { include: { country: true } },
  languages: { include: { language: true } },
  actors: { include: { person: true }, orderBy: { order: 'asc' } },
  directors: { include: { person: true } },
  seasons: {
    orderBy: { number: 'asc' },
    include: {
      episodes: { orderBy: { number: 'asc' } },
    },
  },
};

const SERIES_LIST_INCLUDE = {
  genres: { include: { genre: { select: { id: true, name: true, slug: true, emoji: true } } } },
  countries: { include: { country: { select: { id: true, name: true, code: true, flag: true } } } },
};

@Injectable()
export class SeriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    dto: PaginationDto,
    filters?: FilterSeriesDto,
  ): Promise<PaginatedResponse<any>> {
    const where: Prisma.SeriesWhereInput = {
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
      if (filters.status) {
        where.status = filters.status;
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
      ];
    }

    const orderBy: Prisma.SeriesOrderByWithRelationInput = {};
    const sortBy = filters?.sortBy || dto.sortBy;
    const sortOrder = filters?.sortOrder || dto.sortOrder;

    if (sortBy && ['createdAt', 'year', 'rating', 'viewCount', 'title'].includes(sortBy)) {
      orderBy[sortBy as keyof Prisma.SeriesOrderByWithRelationInput] = sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    const [data, total] = await Promise.all([
      this.prisma.series.findMany({
        where,
        skip: dto.skip,
        take: dto.limit,
        orderBy,
        include: SERIES_LIST_INCLUDE,
      }),
      this.prisma.series.count({ where }),
    ]);

    return new PaginatedResponse(data, total, dto.page, dto.limit);
  }

  async findById(id: string) {
    const series = await this.prisma.series.findUnique({
      where: { id },
      include: SERIES_INCLUDE,
    });

    if (!series) {
      throw new NotFoundException('Series not found');
    }

    return series;
  }

  async findByCode(code: number) {
    const series = await this.prisma.series.findUnique({
      where: { code },
      include: SERIES_INCLUDE,
    });

    if (!series) {
      throw new NotFoundException(`Series with code ${code} not found`);
    }

    return series;
  }

  async search(query: string, dto: PaginationDto): Promise<PaginatedResponse<any>> {
    if (!query || query.trim().length === 0) {
      throw new BadRequestException('Search query is required');
    }

    const where: Prisma.SeriesWhereInput = {
      isActive: true,
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { originalTitle: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    };

    const [data, total] = await Promise.all([
      this.prisma.series.findMany({
        where,
        skip: dto.skip,
        take: dto.limit,
        orderBy: { createdAt: 'desc' },
        include: SERIES_LIST_INCLUDE,
      }),
      this.prisma.series.count({ where }),
    ]);

    return new PaginatedResponse(data, total, dto.page, dto.limit);
  }

  async create(dto: CreateSeriesDto) {
    const baseSlug = await this.generateSlug(dto.title);
    const existingSlug = await this.prisma.series.findFirst({
      where: { slug: baseSlug },
    });
    const slug = existingSlug ? `${baseSlug}-${Date.now()}` : baseSlug;

    const maxCode = await this.prisma.series.findFirst({
      orderBy: { code: 'desc' },
      select: { code: true },
    });
    const nextCode = (maxCode?.code ?? 0) + 1;

    const data: Prisma.SeriesCreateInput = {
      code: nextCode,
      title: dto.title,
      originalTitle: dto.originalTitle,
      slug,
      description: dto.description,
      shortDesc: dto.shortDesc,
      year: dto.year,
      releaseDate: dto.releaseDate,
      status: dto.status ?? 'ongoing',
      totalSeasons: dto.totalSeasons ?? 1,
      totalEpisodes: dto.totalEpisodes ?? 0,
      ageRating: dto.ageRating,
      imdbId: dto.imdbId,
      tmdbId: dto.tmdbId,
      isFeatured: dto.isFeatured ?? false,
      poster: dto.poster,
      backdrop: dto.backdrop,
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
    };

    return this.prisma.series.create({
      data,
      include: SERIES_INCLUDE,
    });
  }

  async update(id: string, dto: UpdateSeriesDto) {
    const existing = await this.findById(id);

    const updateData: Prisma.SeriesUpdateInput = {};

    if (dto.title !== undefined) {
      updateData.title = dto.title;
      if (dto.title !== existing.title) {
        const newSlug = await this.generateSlug(dto.title);
        const slugConflict = await this.prisma.series.findFirst({
          where: { slug: newSlug, id: { not: id } },
        });
        updateData.slug = slugConflict ? `${newSlug}-${Date.now()}` : newSlug;
      }
    }
    if (dto.originalTitle !== undefined) updateData.originalTitle = dto.originalTitle;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.shortDesc !== undefined) updateData.shortDesc = dto.shortDesc;
    if (dto.year !== undefined) updateData.year = dto.year;
    if (dto.releaseDate !== undefined) updateData.releaseDate = dto.releaseDate;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.totalSeasons !== undefined) updateData.totalSeasons = dto.totalSeasons;
    if (dto.totalEpisodes !== undefined) updateData.totalEpisodes = dto.totalEpisodes;
    if (dto.ageRating !== undefined) updateData.ageRating = dto.ageRating;
    if (dto.imdbId !== undefined) updateData.imdbId = dto.imdbId;
    if (dto.tmdbId !== undefined) updateData.tmdbId = dto.tmdbId;
    if (dto.isFeatured !== undefined) updateData.isFeatured = dto.isFeatured;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.poster !== undefined) updateData.poster = dto.poster;
    if (dto.backdrop !== undefined) updateData.backdrop = dto.backdrop;

    if (dto.genres) {
      await this.prisma.seriesGenre.deleteMany({ where: { seriesId: id } });
      updateData.genres = {
        create: dto.genres.map((genreId) => ({ genreId })),
      };
    }

    if (dto.countries) {
      await this.prisma.seriesCountry.deleteMany({ where: { seriesId: id } });
      updateData.countries = {
        create: dto.countries.map((countryId) => ({ countryId })),
      };
    }

    if (dto.languages) {
      await this.prisma.seriesLanguage.deleteMany({ where: { seriesId: id } });
      updateData.languages = {
        create: dto.languages.map((languageId) => ({
          languageId,
          isOriginal: false,
        })),
      };
    }

    if (dto.actors) {
      await this.prisma.seriesActor.deleteMany({ where: { seriesId: id } });
      updateData.actors = {
        create: dto.actors.map((personId, index) => ({
          personId,
          order: index,
        })),
      };
    }

    if (dto.directors) {
      await this.prisma.seriesDirector.deleteMany({ where: { seriesId: id } });
      updateData.directors = {
        create: dto.directors.map((personId) => ({ personId })),
      };
    }

    return this.prisma.series.update({
      where: { id },
      data: updateData,
      include: SERIES_INCLUDE,
    });
  }

  async delete(id: string) {
    await this.findById(id);

    return this.prisma.series.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, title: true, isActive: true },
    });
  }

  async getOngoing() {
    return this.prisma.series.findMany({
      where: { isActive: true, status: 'ongoing' },
      orderBy: { createdAt: 'desc' },
      include: SERIES_LIST_INCLUDE,
    });
  }

  async getCompleted() {
    return this.prisma.series.findMany({
      where: { isActive: true, status: 'completed' },
      orderBy: { createdAt: 'desc' },
      include: SERIES_LIST_INCLUDE,
    });
  }

  async getTrending(limit: number = 20) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const data = await this.prisma.series.findMany({
      where: {
        isActive: true,
        createdAt: { gte: sevenDaysAgo },
      },
      take: limit,
      orderBy: { viewCount: 'desc' },
      include: SERIES_LIST_INCLUDE,
    });

    if (data.length < limit) {
      const remaining = limit - data.length;
      const olderSeries = await this.prisma.series.findMany({
        where: {
          isActive: true,
          id: { notIn: data.map((s) => s.id) },
        },
        take: remaining,
        orderBy: { viewCount: 'desc' },
        include: SERIES_LIST_INCLUDE,
      });
      data.push(...olderSeries);
    }

    return data;
  }

  async getNewReleases(limit: number = 20) {
    return this.prisma.series.findMany({
      where: { isActive: true },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: SERIES_LIST_INCLUDE,
    });
  }

  async getTopRated(limit: number = 20) {
    return this.prisma.series.findMany({
      where: {
        isActive: true,
        ratingCount: { gt: 0 },
      },
      take: limit,
      orderBy: { rating: 'desc' },
      include: SERIES_LIST_INCLUDE,
    });
  }

  async getRandom() {
    const count = await this.prisma.series.count({
      where: { isActive: true },
    });

    if (count === 0) {
      throw new NotFoundException('No series available');
    }

    const skip = Math.floor(Math.random() * count);

    const [series] = await this.prisma.series.findMany({
      where: { isActive: true },
      skip,
      take: 1,
      include: SERIES_INCLUDE,
    });

    return series;
  }

  async addSeason(seriesId: string, dto: CreateSeasonDto) {
    await this.findById(seriesId);

    const existingSeason = await this.prisma.season.findFirst({
      where: { seriesId, number: dto.number },
    });

    if (existingSeason) {
      throw new NotFoundException(`Season ${dto.number} already exists for this series`);
    }

    const season = await this.prisma.season.create({
      data: {
        seriesId,
        number: dto.number,
        title: dto.title,
        description: dto.description,
        poster: dto.poster,
        year: dto.year,
      },
      include: { episodes: true },
    });

    await this.prisma.series.update({
      where: { id: seriesId },
      data: { totalSeasons: { increment: 1 } },
    });

    return season;
  }

  async addEpisode(seasonId: string, dto: CreateEpisodeDto) {
    const season = await this.prisma.season.findUnique({
      where: { id: seasonId },
      include: { series: true },
    });

    if (!season) {
      throw new NotFoundException('Season not found');
    }

    const existingEpisode = await this.prisma.episode.findFirst({
      where: { seasonId, number: dto.number },
    });

    if (existingEpisode) {
      throw new NotFoundException(`Episode ${dto.number} already exists in this season`);
    }

    const episode = await this.prisma.episode.create({
      data: {
        seasonId,
        number: dto.number,
        title: dto.title,
        description: dto.description,
        duration: dto.duration,
        airDate: dto.airDate,
        poster: dto.poster,
        telegramFileId: dto.telegramFileId,
        cloudUrl: dto.cloudUrl,
        quality: dto.quality,
        fileSize: dto.fileSize ? BigInt(Math.floor(dto.fileSize)) : undefined,
      },
    });

    await this.prisma.series.update({
      where: { id: season.seriesId },
      data: { totalEpisodes: { increment: 1 } },
    });

    return episode;
  }

  async updateEpisode(episodeId: string, dto: UpdateEpisodeDto) {
    const existingEpisode = await this.prisma.episode.findUnique({
      where: { id: episodeId },
    });

    if (!existingEpisode) {
      throw new NotFoundException('Episode not found');
    }

    const updateData: Prisma.EpisodeUpdateInput = {};

    if (dto.number !== undefined) updateData.number = dto.number;
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.duration !== undefined) updateData.duration = dto.duration;
    if (dto.airDate !== undefined) updateData.airDate = dto.airDate;
    if (dto.poster !== undefined) updateData.poster = dto.poster;
    if (dto.telegramFileId !== undefined) updateData.telegramFileId = dto.telegramFileId;
    if (dto.cloudUrl !== undefined) updateData.cloudUrl = dto.cloudUrl;
    if (dto.quality !== undefined) updateData.quality = dto.quality;
    if (dto.fileSize !== undefined) updateData.fileSize = BigInt(Math.floor(dto.fileSize));

    return this.prisma.episode.update({
      where: { id: episodeId },
      data: updateData,
    });
  }

  async getEpisode(episodeId: string) {
    const episode = await this.prisma.episode.findUnique({
      where: { id: episodeId },
      include: {
        season: {
          include: {
            series: {
              select: {
                id: true,
                title: true,
                slug: true,
                poster: true,
              },
            },
          },
        },
        subtitles: { include: { language: true } },
      },
    });

    if (!episode) {
      throw new NotFoundException('Episode not found');
    }

    return episode;
  }

  async getNextEpisode(seriesId: string, seasonNumber: number, episodeNumber: number) {
    const currentSeason = await this.prisma.season.findFirst({
      where: { seriesId, number: seasonNumber },
      include: {
        episodes: { orderBy: { number: 'asc' } },
      },
    });

    if (!currentSeason) {
      return null;
    }

    const currentEpisodes = currentSeason.episodes;
    const currentIndex = currentEpisodes.findIndex((ep) => ep.number === episodeNumber);

    if (currentIndex !== -1 && currentIndex < currentEpisodes.length - 1) {
      return {
        seasonNumber: currentSeason.number,
        episode: currentEpisodes[currentIndex + 1],
      };
    }

    const nextSeason = await this.prisma.season.findFirst({
      where: {
        seriesId,
        number: seasonNumber + 1,
      },
      include: {
        episodes: { orderBy: { number: 'asc' }, take: 1 },
      },
    });

    if (nextSeason && nextSeason.episodes.length > 0) {
      return {
        seasonNumber: nextSeason.number,
        episode: nextSeason.episodes[0],
      };
    }

    return null;
  }

  async getContinueWatching(userId: string) {
    const watchHistoryEntries = await this.prisma.watchHistory.findMany({
      where: {
        userId,
        seriesId: { not: null },
        episodeId: { not: null },
        completed: false,
      },
      orderBy: { lastWatched: 'desc' },
      take: 20,
      include: {
        series: {
          select: {
            id: true,
            title: true,
            slug: true,
            poster: true,
            backdrop: true,
          },
        },
        episode: {
          select: {
            id: true,
            number: true,
            title: true,
            duration: true,
            season: {
              select: {
                id: true,
                number: true,
              },
            },
          },
        },
      },
    });

    const groupedBySeries = new Map<string, any>();

    for (const entry of watchHistoryEntries) {
      if (!entry.series || !entry.episode) continue;

      const seriesId = entry.seriesId!;
      if (!groupedBySeries.has(seriesId)) {
        groupedBySeries.set(seriesId, {
          series: entry.series,
          lastWatched: entry.lastWatched,
          currentEpisode: {
            ...entry.episode,
            progress: entry.progress,
            duration: entry.duration,
          },
        });
      }
    }

    return Array.from(groupedBySeries.values());
  }

  async incrementView(seriesId: string) {
    await this.findById(seriesId);

    return this.prisma.series.update({
      where: { id: seriesId },
      data: { viewCount: { increment: 1 } },
      select: { id: true, viewCount: true },
    });
  }

  async generateSlug(title: string): Promise<string> {
    const baseSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');

    const existing = await this.prisma.series.findFirst({
      where: { slug: baseSlug },
      select: { id: true },
    });

    if (!existing) {
      return baseSlug;
    }

    let counter = 1;
    let candidate = `${baseSlug}-${counter}`;
    while (
      await this.prisma.series.findFirst({ where: { slug: candidate }, select: { id: true } })
    ) {
      counter++;
      candidate = `${baseSlug}-${counter}`;
    }

    return candidate;
  }
}
