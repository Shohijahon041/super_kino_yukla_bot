import { Injectable, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service';
import {
  SearchQueryDto,
  AutocompleteQueryDto,
  PersonSearchQueryDto,
} from './dto/search.dto';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(
    query: string,
    dto: SearchQueryDto,
  ) {
    if (!query || query.trim().length === 0) {
      throw new BadRequestException('Search query is required');
    }

    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;

    const movieWhere: Prisma.MovieWhereInput = {
      isActive: true,
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { originalTitle: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { tags: { some: { tag: { contains: query, mode: 'insensitive' } } } },
        {
          actors: {
            some: {
              person: { name: { contains: query, mode: 'insensitive' } },
            },
          },
        },
        {
          directors: {
            some: {
              person: { name: { contains: query, mode: 'insensitive' } },
            },
          },
        },
      ],
    };

    const seriesWhere: Prisma.SeriesWhereInput = {
      isActive: true,
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { originalTitle: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        {
          actors: {
            some: {
              person: { name: { contains: query, mode: 'insensitive' } },
            },
          },
        },
        {
          directors: {
            some: {
              person: { name: { contains: query, mode: 'insensitive' } },
            },
          },
        },
      ],
    };

    let movieOrderBy: Prisma.MovieOrderByWithRelationInput = {};
    let seriesOrderBy: Prisma.SeriesOrderByWithRelationInput = {};

    const sortBy = dto.sortBy ?? 'relevance';
    const sortOrder = dto.sortOrder ?? 'desc';

    if (sortBy === 'rating') {
      movieOrderBy = { rating: sortOrder };
      seriesOrderBy = { rating: sortOrder };
    } else if (sortBy === 'year') {
      movieOrderBy = { year: sortOrder };
      seriesOrderBy = { year: sortOrder };
    } else if (sortBy === 'viewCount') {
      movieOrderBy = { viewCount: sortOrder };
      seriesOrderBy = { viewCount: sortOrder };
    } else {
      movieOrderBy = { createdAt: sortOrder };
      seriesOrderBy = { createdAt: sortOrder };
    }

    const [movies, movieTotal, series, seriesTotal] = await Promise.all([
      this.prisma.movie.findMany({
        where: movieWhere,
        skip,
        take: limit,
        orderBy: movieOrderBy,
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
      }),
      this.prisma.movie.count({ where: movieWhere }),
      this.prisma.series.findMany({
        where: seriesWhere,
        skip,
        take: limit,
        orderBy: seriesOrderBy,
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
      }),
      this.prisma.series.count({ where: seriesWhere }),
    ]);

    const movieResults = movies.map((m) => ({ ...m, contentType: 'movie' }));
    const seriesResults = series.map((s) => ({ ...s, contentType: 'series' }));

    const allResults = [...movieResults, ...seriesResults];

    if (sortBy === 'relevance') {
      allResults.sort((a, b) => {
        const scoreA = this.calculateRelevanceScore(a, query);
        const scoreB = this.calculateRelevanceScore(b, query);
        return sortOrder === 'desc' ? scoreB - scoreA : scoreA - scoreB;
      });
    }

    const total = movieTotal + seriesTotal;
    const totalPages = Math.ceil(total / limit);

    return {
      query,
      total,
      page,
      limit,
      totalPages,
      data: allResults.slice(0, limit),
      movies: {
        data: movieResults,
        total: movieTotal,
      },
      series: {
        data: seriesResults,
        total: seriesTotal,
      },
    };
  }

  async searchWithCorrection(query: string) {
    if (!query || query.trim().length === 0) {
      throw new BadRequestException('Search query is required');
    }

    const directResults = await this.searchDirect(query);

    if (directResults.movies.length > 0 || directResults.series.length > 0) {
      return {
        query,
        corrected: false,
        results: directResults,
        suggestions: [],
      };
    }

    const allTitles = await this.getAllTitles();
    const suggestions = this.findSimilarTitles(query, allTitles);

    if (suggestions.length > 0) {
      const correctedQuery = suggestions[0].title;
      const correctedResults = await this.searchDirect(correctedQuery);

      return {
        query,
        corrected: true,
        suggestedQuery: correctedQuery,
        results: correctedResults,
        suggestions: suggestions.map((s) => ({
          title: s.title,
          similarity: s.similarity,
        })),
      };
    }

    return {
      query,
      corrected: false,
      results: directResults,
      suggestions: [],
    };
  }

  async searchByActor(name: string, dto: PersonSearchQueryDto) {
    if (!name || name.trim().length === 0) {
      throw new BadRequestException('Actor name is required');
    }

    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;

    const persons = await this.prisma.person.findMany({
      where: {
        name: { contains: name, mode: 'insensitive' },
      },
    });

    const personIds = persons.map((p) => p.id);

    if (personIds.length === 0) {
      return {
        query: name,
        person: null,
        movies: { data: [], total: 0 },
        series: { data: [], total: 0 },
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

    const movieWhere: Prisma.MovieWhereInput = {
      isActive: true,
      actors: { some: { personId: { in: personIds } } },
    };

    const seriesWhere: Prisma.SeriesWhereInput = {
      isActive: true,
      actors: { some: { personId: { in: personIds } } },
    };

    const [movies, movieTotal, series, seriesTotal] = await Promise.all([
      this.prisma.movie.findMany({
        where: movieWhere,
        skip,
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
          actors: {
            include: { person: { select: { id: true, name: true, avatar: true } } },
            orderBy: { order: 'asc' },
          },
        },
      }),
      this.prisma.movie.count({ where: movieWhere }),
      this.prisma.series.findMany({
        where: seriesWhere,
        skip,
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
          actors: {
            include: { person: { select: { id: true, name: true, avatar: true } } },
            orderBy: { order: 'asc' },
          },
        },
      }),
      this.prisma.series.count({ where: seriesWhere }),
    ]);

    const total = movieTotal + seriesTotal;
    const totalPages = Math.ceil(total / limit);

    return {
      query: name,
      person: persons[0]
        ? { id: persons[0].id, name: persons[0].name, avatar: persons[0].avatar }
        : null,
      movies: {
        data: movies.map((m) => ({ ...m, contentType: 'movie' })),
        total: movieTotal,
      },
      series: {
        data: series.map((s) => ({ ...s, contentType: 'series' })),
        total: seriesTotal,
      },
      total,
      page,
      limit,
      totalPages,
    };
  }

  async searchByDirector(name: string, dto: PersonSearchQueryDto) {
    if (!name || name.trim().length === 0) {
      throw new BadRequestException('Director name is required');
    }

    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;

    const persons = await this.prisma.person.findMany({
      where: {
        name: { contains: name, mode: 'insensitive' },
      },
    });

    const personIds = persons.map((p) => p.id);

    if (personIds.length === 0) {
      return {
        query: name,
        person: null,
        movies: { data: [], total: 0 },
        series: { data: [], total: 0 },
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

    const movieWhere: Prisma.MovieWhereInput = {
      isActive: true,
      directors: { some: { personId: { in: personIds } } },
    };

    const seriesWhere: Prisma.SeriesWhereInput = {
      isActive: true,
      directors: { some: { personId: { in: personIds } } },
    };

    const [movies, movieTotal, series, seriesTotal] = await Promise.all([
      this.prisma.movie.findMany({
        where: movieWhere,
        skip,
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
          directors: {
            include: { person: { select: { id: true, name: true, avatar: true } } },
          },
        },
      }),
      this.prisma.movie.count({ where: movieWhere }),
      this.prisma.series.findMany({
        where: seriesWhere,
        skip,
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
          directors: {
            include: { person: { select: { id: true, name: true, avatar: true } } },
          },
        },
      }),
      this.prisma.series.count({ where: seriesWhere }),
    ]);

    const total = movieTotal + seriesTotal;
    const totalPages = Math.ceil(total / limit);

    return {
      query: name,
      person: persons[0]
        ? { id: persons[0].id, name: persons[0].name, avatar: persons[0].avatar }
        : null,
      movies: {
        data: movies.map((m) => ({ ...m, contentType: 'movie' })),
        total: movieTotal,
      },
      series: {
        data: series.map((s) => ({ ...s, contentType: 'series' })),
        total: seriesTotal,
      },
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getPopularSearches(limit: number = 20) {
    const popular = await this.prisma.aISearchLog.groupBy({
      by: ['query'],
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      _count: { query: true },
      orderBy: { _count: { query: 'desc' } },
      take: limit,
    });

    return popular.map((p) => ({
      query: p.query,
      count: p._count.query,
    }));
  }

  async getRecentSearches(userId: string) {
    const recent = await this.prisma.aISearchLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        query: true,
        type: true,
        results: true,
        createdAt: true,
      },
    });

    const uniqueQueries = new Map<string, typeof recent[0]>();
    for (const entry of recent) {
      if (!uniqueQueries.has(entry.query)) {
        uniqueQueries.set(entry.query, entry);
      }
    }

    return Array.from(uniqueQueries.values()).slice(0, 20);
  }

  async logSearch(
    userId: string | null,
    query: string,
    type: string,
    results: number,
  ) {
    return this.prisma.aISearchLog.create({
      data: {
        userId,
        query,
        type,
        results,
      },
    });
  }

  async autocomplete(query: string, limit: number = 10) {
    if (!query || query.trim().length < 2) {
      return { query, suggestions: [] };
    }

    const [movies, series] = await Promise.all([
      this.prisma.movie.findMany({
        where: {
          isActive: true,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { originalTitle: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          title: true,
          originalTitle: true,
          slug: true,
          poster: true,
        },
        orderBy: { viewCount: 'desc' },
        take: limit,
      }),
      this.prisma.series.findMany({
        where: {
          isActive: true,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { originalTitle: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          title: true,
          originalTitle: true,
          slug: true,
          poster: true,
        },
        orderBy: { viewCount: 'desc' },
        take: limit,
      }),
    ]);

    const movieSuggestions = movies.map((m) => ({
      title: m.title,
      originalTitle: m.originalTitle,
      slug: m.slug,
      poster: m.poster,
      contentType: 'movie' as const,
    }));

    const seriesSuggestions = series.map((s) => ({
      title: s.title,
      originalTitle: s.originalTitle,
      slug: s.slug,
      poster: s.poster,
      contentType: 'series' as const,
    }));

    const allSuggestions = [...movieSuggestions, ...seriesSuggestions];

    allSuggestions.sort((a, b) => {
      const aStartsWith = a.title.toLowerCase().startsWith(query.toLowerCase());
      const bStartsWith = b.title.toLowerCase().startsWith(query.toLowerCase());
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      return 0;
    });

    return {
      query,
      suggestions: allSuggestions.slice(0, limit),
    };
  }

  private async searchDirect(query: string) {
    const movieWhere: Prisma.MovieWhereInput = {
      isActive: true,
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { originalTitle: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { tags: { some: { tag: { contains: query, mode: 'insensitive' } } } },
      ],
    };

    const seriesWhere: Prisma.SeriesWhereInput = {
      isActive: true,
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { originalTitle: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    };

    const [movies, movieTotal, series, seriesTotal] = await Promise.all([
      this.prisma.movie.findMany({
        where: movieWhere,
        take: 20,
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
      }),
      this.prisma.movie.count({ where: movieWhere }),
      this.prisma.series.findMany({
        where: seriesWhere,
        take: 20,
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
      }),
      this.prisma.series.count({ where: seriesWhere }),
    ]);

    return {
      movies: movies.map((m) => ({ ...m, contentType: 'movie' })),
      movieTotal,
      series: series.map((s) => ({ ...s, contentType: 'series' })),
      seriesTotal,
      total: movieTotal + seriesTotal,
    };
  }

  private async getAllTitles(): Promise<string[]> {
    const [movies, series] = await Promise.all([
      this.prisma.movie.findMany({
        where: { isActive: true },
        select: { title: true, originalTitle: true },
        take: 5000,
      }),
      this.prisma.series.findMany({
        where: { isActive: true },
        select: { title: true, originalTitle: true },
        take: 5000,
      }),
    ]);

    const titles: string[] = [];
    for (const m of movies) {
      titles.push(m.title);
      if (m.originalTitle) titles.push(m.originalTitle);
    }
    for (const s of series) {
      titles.push(s.title);
      if (s.originalTitle) titles.push(s.originalTitle);
    }

    return [...new Set(titles)];
  }

  private findSimilarTitles(
    query: string,
    titles: string[],
  ): { title: string; similarity: number }[] {
    const queryLower = query.toLowerCase().trim();
    const results: { title: string; similarity: number }[] = [];

    for (const title of titles) {
      const titleLower = title.toLowerCase();
      const distance = this.levenshteinDistance(queryLower, titleLower);
      const maxLen = Math.max(queryLower.length, titleLower.length);
      const similarity = maxLen > 0 ? 1 - distance / maxLen : 0;

      if (similarity > 0.4 || titleLower.includes(queryLower) || queryLower.includes(titleLower)) {
        results.push({ title, similarity });
      }
    }

    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, 5);
  }

  private levenshteinDistance(a: string, b: string): number {
    const m = a.length;
    const n = b.length;

    if (m === 0) return n;
    if (n === 0) return m;

    const dp: number[][] = [];

    for (let i = 0; i <= m; i++) {
      dp[i] = [];
      for (let j = 0; j <= n; j++) {
        if (i === 0) {
          dp[i][j] = j;
        } else if (j === 0) {
          dp[i][j] = i;
        } else {
          const cost = a[i - 1] === b[j - 1] ? 0 : 1;
          dp[i][j] = Math.min(
            dp[i - 1][j] + 1,
            dp[i][j - 1] + 1,
            dp[i - 1][j - 1] + cost,
          );
        }
      }
    }

    return dp[m][n];
  }

  private calculateRelevanceScore(item: any, query: string): number {
    let score = 0;
    const queryLower = query.toLowerCase();
    const title = (item.title ?? '').toLowerCase();
    const originalTitle = (item.originalTitle ?? '').toLowerCase();
    const description = (item.description ?? '').toLowerCase();

    if (title === queryLower) {
      score += 100;
    } else if (title.startsWith(queryLower)) {
      score += 80;
    } else if (title.includes(queryLower)) {
      score += 60;
    }

    if (originalTitle && originalTitle.includes(queryLower)) {
      score += 50;
    }

    if (description.includes(queryLower)) {
      score += 20;
    }

    if (item.rating > 0) {
      score += (item.rating / 10) * 15;
    }

    if (item.viewCount > 0) {
      score += Math.min(item.viewCount / 10000, 10);
    }

    if (item.isFeatured) {
      score += 5;
    }

    return score;
  }
}
