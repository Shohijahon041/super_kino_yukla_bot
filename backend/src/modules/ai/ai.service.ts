import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service';

export interface ScoredResult {
  item: any;
  type: 'movie' | 'series';
  score: number;
}

export interface TrendingMovie {
  id: string;
  title: string;
  slug: string;
  poster: string | null;
  year: number | null;
  rating: number;
  totalViews: number;
  recentViews: number;
  velocity: number;
  trendScore: number;
  trendDirection: 'rising' | 'stable' | 'declining';
}

export interface TrendingSeries {
  id: string;
  title: string;
  slug: string;
  poster: string | null;
  year: number | null;
  rating: number;
  totalViews: number;
  recentViews: number;
  velocity: number;
  trendScore: number;
  trendDirection: 'rising' | 'stable' | 'declining';
}

const MOOD_GENRE_MAP: Record<string, string[]> = {
  scary: ['xorror', 'horror', 'qo\'rqinchli', 'ужас', '恐怖'],
  funny: ['komediya', 'comedy', 'kulgili', 'комедия', '喜剧'],
  romantic: ['romantik', 'romance', 'love', 'романтика', '爱情'],
  adventure: ['sarguzasht', 'adventure', 'action', 'приключение', '冒险'],
  drama: ['drama', 'dramatik', 'драма', '剧情'],
  thriller: ['thriller', 'triller', 'триллер', '惊悚'],
  sciFi: ['fantastika', 'science fiction', 'sci-fi', 'фантастика', '科幻'],
  documentary: ['documentary', 'hujjatli', 'документальный', '纪录片'],
  action: ['harakat', 'action', 'екшн', '动作'],
  mystery: ['sirli', 'mystery', 'детектив', '悬疑'],
  animation: ['multfilm', 'animation', 'анимация', '动画'],
  family: ['oila', 'family', 'семейный', '家庭'],
  crime: ['jinoyat', 'crime', 'криминал', '犯罪'],
  war: ['urush', 'war', 'война', '战争'],
  western: ['vestern', 'western', 'вестерн', '西部'],
  fantasy: ['fantaziya', 'fantasy', 'фэнтези', '奇幻'],
  music: ['musiqa', 'music', 'musical', '音乐'],
  sport: ['sport', 'спорт', '运动'],
  history: ['tarix', 'history', 'история', '历史'],
};

interface ParsedQuery {
  genres: string[];
  actors: string[];
  year?: number;
  keywords: string[];
}

@Injectable()
export class AIService {
  constructor(private readonly prisma: PrismaService) {}

  async getRecommendations(userId: string, limit: number = 20) {
    const userHistory = await this.prisma.watchHistory.findMany({
      where: { userId, completed: true },
      include: {
        movie: {
          include: {
            genres: { include: { genre: true } },
            countries: { include: { country: true } },
          },
        },
        series: {
          include: {
            genres: { include: { genre: true } },
            countries: { include: { country: true } },
          },
        },
      },
      orderBy: { lastWatched: 'desc' },
      take: 100,
    });

    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      include: {
        movie: {
          include: { genres: { include: { genre: true } } },
        },
        series: {
          include: { genres: { include: { genre: true } } },
        },
      },
    });

    const likedGenreIds = new Map<string, number>();
    const likedCountryIds = new Map<string, number>();
    const watchedMovieIds = new Set<string>();
    const watchedSeriesIds = new Set<string>();

    for (const entry of userHistory) {
      if (entry.movieId) {
        watchedMovieIds.add(entry.movieId);
        for (const mg of entry.movie?.genres ?? []) {
          likedGenreIds.set(mg.genreId, (likedGenreIds.get(mg.genreId) ?? 0) + 2);
        }
        for (const mc of entry.movie?.countries ?? []) {
          likedCountryIds.set(mc.countryId, (likedCountryIds.get(mc.countryId) ?? 0) + 1);
        }
      }
      if (entry.seriesId) {
        watchedSeriesIds.add(entry.seriesId);
        for (const sg of entry.series?.genres ?? []) {
          likedGenreIds.set(sg.genreId, (likedGenreIds.get(sg.genreId) ?? 0) + 2);
        }
        for (const sc of entry.series?.countries ?? []) {
          likedCountryIds.set(sc.countryId, (likedCountryIds.get(sc.countryId) ?? 0) + 1);
        }
      }
    }

    for (const fav of favorites) {
      if (fav.movieId) {
        watchedMovieIds.add(fav.movieId);
        for (const mg of fav.movie?.genres ?? []) {
          likedGenreIds.set(mg.genreId, (likedGenreIds.get(mg.genreId) ?? 0) + 3);
        }
      }
      if (fav.seriesId) {
        watchedSeriesIds.add(fav.seriesId);
        for (const sg of fav.series?.genres ?? []) {
          likedGenreIds.set(sg.genreId, (likedGenreIds.get(sg.genreId) ?? 0) + 3);
        }
      }
    }

    const topGenreIds = [...likedGenreIds.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id);

    const topCountryIds = [...likedCountryIds.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => id);

    const candidateMovies = await this.prisma.movie.findMany({
      where: {
        isActive: true,
        id: { notIn: [...watchedMovieIds] },
        ...(topGenreIds.length > 0
          ? { genres: { some: { genreId: { in: topGenreIds } } } }
          : {}),
      },
      include: {
        genres: { include: { genre: true } },
        countries: { include: { country: true } },
      },
      take: limit * 3,
    });

    const candidateSeries = await this.prisma.series.findMany({
      where: {
        isActive: true,
        id: { notIn: [...watchedSeriesIds] },
        ...(topGenreIds.length > 0
          ? { genres: { some: { genreId: { in: topGenreIds } } } }
          : {}),
      },
      include: {
        genres: { include: { genre: true } },
        countries: { include: { country: true } },
      },
      take: limit * 3,
    });

    interface ScoredItem {
      type: 'movie' | 'series';
      content: any;
      score: number;
      reason: string;
    }

    const scored: ScoredItem[] = [];

    for (const movie of candidateMovies) {
      let score = 0;
      const reasons: string[] = [];

      const movieGenreIds = movie.genres.map((g) => g.genreId);
      const genreOverlap = movieGenreIds.filter((id) => topGenreIds.includes(id)).length;
      score += genreOverlap * 25;

      const movieCountryIds = movie.countries.map((c) => c.countryId);
      const countryOverlap = movieCountryIds.filter((id) => topCountryIds.includes(id)).length;
      score += countryOverlap * 10;

      if (movie.rating > 0) {
        score += (movie.rating / 10) * 15;
      }

      if (movie.isFeatured) score += 5;

      const viewScore = Math.min(movie.viewCount / 10000, 10);
      score += viewScore;

      if (genreOverlap > 0) {
        const genreNames = movie.genres
          .filter((g) => topGenreIds.includes(g.genreId))
          .map((g) => g.genre.name);
        reasons.push(`Siz ${genreNames.join(', ')} janrlarini yoqtirasiz`);
      }

      if (movie.rating >= 8) {
        reasons.push(`Yuqori baho: ${movie.rating.toFixed(1)}`);
      }

      if (movie.isFeatured) {
        reasons.push('Tavsiya etilgan kontent');
      }

      scored.push({
        type: 'movie',
        content: movie,
        score,
        reason: reasons.length > 0 ? reasons[0] : 'Sizning middlingizga mos',
      });
    }

    for (const series of candidateSeries) {
      let score = 0;
      const reasons: string[] = [];

      const seriesGenreIds = series.genres.map((g) => g.genreId);
      const genreOverlap = seriesGenreIds.filter((id) => topGenreIds.includes(id)).length;
      score += genreOverlap * 25;

      const seriesCountryIds = series.countries.map((c) => c.countryId);
      const countryOverlap = seriesCountryIds.filter((id) => topCountryIds.includes(id)).length;
      score += countryOverlap * 10;

      if (series.rating > 0) {
        score += (series.rating / 10) * 15;
      }

      if (series.isFeatured) score += 5;

      const viewScore = Math.min(series.viewCount / 10000, 10);
      score += viewScore;

      if (genreOverlap > 0) {
        const genreNames = series.genres
          .filter((g) => topGenreIds.includes(g.genreId))
          .map((g) => g.genre.name);
        reasons.push(`Siz ${genreNames.join(', ')} janrlarini yoqtirasiz`);
      }

      if (series.rating >= 8) {
        reasons.push(`Yuqori baho: ${series.rating.toFixed(1)}`);
      }

      scored.push({
        type: 'series',
        content: series,
        score,
        reason: reasons.length > 0 ? reasons[0] : 'Sizning middlingizga mos',
      });
    }

    scored.sort((a, b) => b.score - a.score);
    const topResults = scored.slice(0, limit);

    const recommendations = await Promise.all(
      topResults.map(async (item) => {
        const saved = await this.trackRecommendation(
          userId,
          item.content.id,
          item.type,
          item.score,
          item.reason,
          'content_based',
        );
        return {
          ...saved,
          content: item.content,
          contentType: item.type,
        };
      }),
    );

    return {
      recommendations,
      basedOn: {
        watchedMovies: watchedMovieIds.size,
        watchedSeries: watchedSeriesIds.size,
        topGenres: topGenreIds.length,
        topCountries: topCountryIds.length,
      },
    };
  }

  async getMoodRecommendations(mood: string, limit: number = 20) {
    const normalizedMood = mood.toLowerCase().trim();

    const genreSlugs = MOOD_GENRE_MAP[normalizedMood] ?? [normalizedMood];

    const matchedGenres = await this.prisma.genre.findMany({
      where: {
        OR: [
          { slug: { in: genreSlugs.map((g) => g.toLowerCase()) } },
          { name: { contains: normalizedMood, mode: 'insensitive' } },
          {
            slug: {
              contains: normalizedMood
                .toLowerCase()
                .replace(/[^a-z0-9\s]/g, '')
                .trim(),
              mode: 'insensitive',
            },
          },
        ],
      },
    });

    if (matchedGenres.length === 0) {
      throw new BadRequestException(
        `"${mood}" mavjud emas. Mouringizni boshqacha yozing.`,
      );
    }

    const genreIds = matchedGenres.map((g) => g.id);

    const [movies, series] = await Promise.all([
      this.prisma.movie.findMany({
        where: {
          isActive: true,
          genres: { some: { genreId: { in: genreIds } } },
        },
        include: {
          genres: { include: { genre: true } },
          countries: { include: { country: true } },
        },
        orderBy: [{ rating: 'desc' }, { viewCount: 'desc' }],
        take: limit,
      }),
      this.prisma.series.findMany({
        where: {
          isActive: true,
          genres: { some: { genreId: { in: genreIds } } },
        },
        include: {
          genres: { include: { genre: true } },
          countries: { include: { country: true } },
        },
        orderBy: [{ rating: 'desc' }, { viewCount: 'desc' }],
        take: limit,
      }),
    ]);

    const allResults = [
      ...movies.map((m) => ({ ...m, contentType: 'movie' as const })),
      ...series.map((s) => ({ ...s, contentType: 'series' as const })),
    ];

    allResults.sort((a, b) => {
      const scoreA = (a.rating / 10) * 0.6 + Math.min(a.viewCount / 5000, 1) * 0.4;
      const scoreB = (b.rating / 10) * 0.6 + Math.min(b.viewCount / 5000, 1) * 0.4;
      return scoreB - scoreA;
    });

    return {
      mood: normalizedMood,
      matchedGenres: matchedGenres.map((g) => ({ id: g.id, name: g.name, emoji: g.emoji })),
      results: allResults.slice(0, limit),
      total: allResults.length,
    };
  }

  async getSimilarContent(
    contentId: string,
    contentType: 'movie' | 'series',
    limit: number = 20,
  ) {
    if (contentType === 'movie') {
      const movie = await this.prisma.movie.findUnique({
        where: { id: contentId },
        include: {
          genres: { include: { genre: true } },
          countries: { include: { country: true } },
        },
      });

      if (!movie) {
        throw new NotFoundException('Movie not found');
      }

      const genreIds = movie.genres.map((g) => g.genreId);
      const countryIds = movie.countries.map((c) => c.countryId);
      const targetYear = movie.year ?? 0;

      const candidates = await this.prisma.movie.findMany({
        where: {
          isActive: true,
          id: { not: contentId },
          OR: [
            ...(genreIds.length > 0
              ? [{ genres: { some: { genreId: { in: genreIds } } } }]
              : []),
            ...(countryIds.length > 0
              ? [{ countries: { some: { countryId: { in: countryIds } } } }]
              : []),
            ...(targetYear > 0
              ? [{ year: { gte: targetYear - 5, lte: targetYear + 5 } }]
              : []),
          ],
        },
        include: {
          genres: { include: { genre: true } },
          countries: { include: { country: true } },
        },
        take: limit * 3,
      });

      interface ScoredContent {
        item: any;
        score: number;
      }

      const scored: ScoredContent[] = candidates.map((c) => {
        let score = 0;

        const cGenreIds = c.genres.map((g) => g.genreId);
        score += cGenreIds.filter((id) => genreIds.includes(id)).length * 30;

        const cCountryIds = c.countries.map((co) => co.countryId);
        score += cCountryIds.filter((id) => countryIds.includes(id)).length * 15;

        if (targetYear > 0 && c.year) {
          const yearDiff = Math.abs(c.year - targetYear);
          score += Math.max(0, 20 - yearDiff * 2);
        }

        if (c.rating > 0) {
          score += (c.rating / 10) * 10;
        }

        return { item: c, score };
      });

      scored.sort((a, b) => b.score - a.score);

      return {
        source: movie,
        sourceType: 'movie',
        results: scored.slice(0, limit).map((s) => ({
          ...s.item,
          contentType: 'movie',
          similarityScore: s.score,
        })),
        total: scored.length,
      };
    } else {
      const series = await this.prisma.series.findUnique({
        where: { id: contentId },
        include: {
          genres: { include: { genre: true } },
          countries: { include: { country: true } },
        },
      });

      if (!series) {
        throw new NotFoundException('Series not found');
      }

      const genreIds = series.genres.map((g) => g.genreId);
      const countryIds = series.countries.map((c) => c.countryId);
      const targetYear = series.year ?? 0;

      const candidates = await this.prisma.series.findMany({
        where: {
          isActive: true,
          id: { not: contentId },
          OR: [
            ...(genreIds.length > 0
              ? [{ genres: { some: { genreId: { in: genreIds } } } }]
              : []),
            ...(countryIds.length > 0
              ? [{ countries: { some: { countryId: { in: countryIds } } } }]
              : []),
            ...(targetYear > 0
              ? [{ year: { gte: targetYear - 5, lte: targetYear + 5 } }]
              : []),
          ],
        },
        include: {
          genres: { include: { genre: true } },
          countries: { include: { country: true } },
        },
        take: limit * 3,
      });

      interface ScoredContent {
        item: any;
        score: number;
      }

      const scored: ScoredContent[] = candidates.map((c) => {
        let score = 0;

        const cGenreIds = c.genres.map((g) => g.genreId);
        score += cGenreIds.filter((id) => genreIds.includes(id)).length * 30;

        const cCountryIds = c.countries.map((co) => co.countryId);
        score += cCountryIds.filter((id) => countryIds.includes(id)).length * 15;

        if (targetYear > 0 && c.year) {
          const yearDiff = Math.abs(c.year - targetYear);
          score += Math.max(0, 20 - yearDiff * 2);
        }

        if (c.rating > 0) {
          score += (c.rating / 10) * 10;
        }

        return { item: c, score };
      });

      scored.sort((a, b) => b.score - a.score);

      return {
        source: series,
        sourceType: 'series',
        results: scored.slice(0, limit).map((s) => ({
          ...s.item,
          contentType: 'series',
          similarityScore: s.score,
        })),
        total: scored.length,
      };
    }
  }

  async naturalLanguageSearch(query: string, userId?: string) {
    const parsed = this.parseNaturalLanguage(query);

    const results: { type: string; score: number; content: any }[] = [];

    const movieWhere: Prisma.MovieWhereInput = { isActive: true };

    const movieOr: Prisma.MovieWhereInput[] = [];

    if (parsed.keywords.length > 0) {
      for (const kw of parsed.keywords) {
        movieOr.push(
          { title: { contains: kw, mode: 'insensitive' } },
          { originalTitle: { contains: kw, mode: 'insensitive' } },
          { description: { contains: kw, mode: 'insensitive' } },
          { tags: { some: { tag: { contains: kw, mode: 'insensitive' } } } },
        );
      }
    }

    if (parsed.year) {
      movieWhere.year = parsed.year;
    }

    if (parsed.genres.length > 0) {
      const matchedGenres = await this.prisma.genre.findMany({
        where: {
          OR: [
            {
              slug: {
                in: parsed.genres.map((g) => g.toLowerCase().replace(/\s+/g, '-')),
              },
            },
            { name: { contains: parsed.genres[0], mode: 'insensitive' } },
          ],
        },
      });

      if (matchedGenres.length > 0) {
        movieWhere.genres = {
          some: { genreId: { in: matchedGenres.map((g) => g.id) } },
        };
      }
    }

    if (parsed.actors.length > 0) {
      const matchedPersons = await this.prisma.person.findMany({
        where: {
          OR: parsed.actors.map((name) => ({
            name: { contains: name, mode: 'insensitive' as const },
          })),
        },
      });

      if (matchedPersons.length > 0) {
        movieWhere.actors = {
          some: { personId: { in: matchedPersons.map((p) => p.id) } },
        };
      }
    }

    if (movieOr.length > 0 && !parsed.actors.length) {
      movieWhere.OR = movieOr;
    }

    const [movies, movieTotal] = await Promise.all([
      this.prisma.movie.findMany({
        where: movieWhere,
        include: {
          genres: { include: { genre: { select: { id: true, name: true, slug: true, emoji: true } } } },
          countries: { include: { country: { select: { id: true, name: true, code: true, flag: true } } } },
        },
        orderBy: [{ rating: 'desc' }, { viewCount: 'desc' }],
        take: 20,
      }),
      this.prisma.movie.count({ where: movieWhere }),
    ]);

    const seriesWhere: Prisma.SeriesWhereInput = { isActive: true };

    if (parsed.keywords.length > 0 && !parsed.actors.length) {
      seriesWhere.OR = [
        ...parsed.keywords.map((kw) => ({
          title: { contains: kw, mode: 'insensitive' as const },
        })),
        ...parsed.keywords.map((kw) => ({
          originalTitle: { contains: kw, mode: 'insensitive' as const },
        })),
        ...parsed.keywords.map((kw) => ({
          description: { contains: kw, mode: 'insensitive' as const },
        })),
      ];
    }

    if (parsed.year) {
      seriesWhere.year = parsed.year;
    }

    if (parsed.genres.length > 0) {
      const matchedGenres = await this.prisma.genre.findMany({
        where: {
          OR: [
            {
              slug: {
                in: parsed.genres.map((g) => g.toLowerCase().replace(/\s+/g, '-')),
              },
            },
            { name: { contains: parsed.genres[0], mode: 'insensitive' } },
          ],
        },
      });

      if (matchedGenres.length > 0) {
        seriesWhere.genres = {
          some: { genreId: { in: matchedGenres.map((g) => g.id) } },
        };
      }
    }

    if (parsed.actors.length > 0) {
      const matchedPersons = await this.prisma.person.findMany({
        where: {
          OR: parsed.actors.map((name) => ({
            name: { contains: name, mode: 'insensitive' as const },
          })),
        },
      });

      if (matchedPersons.length > 0) {
        seriesWhere.actors = {
          some: { personId: { in: matchedPersons.map((p) => p.id) } },
        };
      }
    }

    const [series, seriesTotal] = await Promise.all([
      this.prisma.series.findMany({
        where: seriesWhere,
        include: {
          genres: { include: { genre: { select: { id: true, name: true, slug: true, emoji: true } } } },
          countries: { include: { country: { select: { id: true, name: true, code: true, flag: true } } } },
        },
        orderBy: [{ rating: 'desc' }, { viewCount: 'desc' }],
        take: 20,
      }),
      this.prisma.series.count({ where: seriesWhere }),
    ]);

    if (userId) {
      await this.prisma.aISearchLog.create({
        data: {
          userId,
          query,
          type: 'nlp',
          results: movieTotal + seriesTotal,
        },
      });
    }

    return {
      query,
      parsed: {
        genres: parsed.genres,
        actors: parsed.actors,
        year: parsed.year,
        keywords: parsed.keywords,
      },
      movies: {
        data: movies,
        total: movieTotal,
      },
      series: {
        data: series,
        total: seriesTotal,
      },
      total: movieTotal + seriesTotal,
    };
  }

  async identifyMovie(description: string) {
    const keywords = this.extractKeywords(description);

    if (keywords.length === 0) {
      throw new BadRequestException(
        'Tavsifdan kalit so\'zlarni ajratib bo\'lmadi. Batafsil yozing.',
      );
    }

    const [movies, series] = await Promise.all([
      this.prisma.movie.findMany({
        where: {
          isActive: true,
          OR: [
            ...keywords.map((kw) => ({
              title: { contains: kw, mode: 'insensitive' as const },
            })),
            ...keywords.map((kw) => ({
              description: { contains: kw, mode: 'insensitive' as const },
            })),
            ...keywords.map((kw) => ({
              tags: { some: { tag: { contains: kw, mode: 'insensitive' as const } } },
            })),
          ],
        },
        include: {
          genres: { include: { genre: { select: { id: true, name: true, slug: true, emoji: true } } } },
          countries: { include: { country: { select: { id: true, name: true, code: true, flag: true } } } },
        },
        orderBy: [{ rating: 'desc' }, { viewCount: 'desc' }],
        take: 10,
      }),
      this.prisma.series.findMany({
        where: {
          isActive: true,
          OR: [
            ...keywords.map((kw) => ({
              title: { contains: kw, mode: 'insensitive' as const },
            })),
            ...keywords.map((kw) => ({
              description: { contains: kw, mode: 'insensitive' as const },
            })),
          ],
        },
        include: {
          genres: { include: { genre: { select: { id: true, name: true, slug: true, emoji: true } } } },
          countries: { include: { country: { select: { id: true, name: true, code: true, flag: true } } } },
        },
        orderBy: [{ rating: 'desc' }, { viewCount: 'desc' }],
        take: 10,
      }),
    ]);

    const scored: ScoredResult[] = [];

    for (const movie of movies) {
      let score = 0;
      const searchText = `${movie.title} ${movie.originalTitle ?? ''} ${movie.description ?? ''}`.toLowerCase();

      for (const kw of keywords) {
        if (searchText.includes(kw.toLowerCase())) {
          score += 10;
        }
        if (movie.title.toLowerCase().includes(kw.toLowerCase())) {
          score += 20;
        }
      }

      if (movie.rating > 0) {
        score += (movie.rating / 10) * 5;
      }

      scored.push({ item: movie, type: 'movie', score });
    }

    for (const s of series) {
      let score = 0;
      const searchText = `${s.title} ${s.originalTitle ?? ''} ${s.description ?? ''}`.toLowerCase();

      for (const kw of keywords) {
        if (searchText.includes(kw.toLowerCase())) {
          score += 10;
        }
        if (s.title.toLowerCase().includes(kw.toLowerCase())) {
          score += 20;
        }
      }

      if (s.rating > 0) {
        score += (s.rating / 10) * 5;
      }

      scored.push({ item: s, type: 'series', score });
    }

    scored.sort((a, b) => b.score - a.score);

    return {
      description,
      keywords,
      results: scored.slice(0, 10),
      total: scored.length,
    };
  }

  async generateSpoilerWarning(
    contentId: string,
    contentType: 'movie' | 'series',
  ) {
    const spoilerReviews = await this.prisma.review.findMany({
      where: {
        spoiler: true,
        isActive: true,
        ...(contentType === 'movie'
          ? { movieId: contentId }
          : { seriesId: contentId }),
      },
      orderBy: { likes: 'desc' },
      take: 10,
    });

    const allReviews = await this.prisma.review.findMany({
      where: {
        isActive: true,
        ...(contentType === 'movie'
          ? { movieId: contentId }
          : { seriesId: contentId }),
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    let content: any = null;
    if (contentType === 'movie') {
      content = await this.prisma.movie.findUnique({
        where: { id: contentId },
        select: {
          id: true,
          title: true,
          description: true,
          rating: true,
          ratingCount: true,
        },
      });
    } else {
      content = await this.prisma.series.findUnique({
        where: { id: contentId },
        select: {
          id: true,
          title: true,
          description: true,
          rating: true,
          ratingCount: true,
        },
      });
    }

    if (!content) {
      throw new NotFoundException(`${contentType === 'movie' ? 'Film' : 'Serial'} topilmadi`);
    }

    const spoilerSentences = spoilerReviews
      .flatMap((r) => (r.content ? [r.content] : []))
      .slice(0, 5);

    const nonSpoilerSummaries = allReviews
      .filter((r) => !r.spoiler && r.content)
      .slice(0, 5)
      .map((r) => r.content!);

    return {
      content: {
        id: content.id,
        title: content.title,
        rating: content.rating,
        ratingCount: content.ratingCount,
      },
      spoilerWarning: {
        hasSpoilers: spoilerReviews.length > 0,
        spoilerCount: spoilerReviews.length,
        spoilerExcerpts: spoilerSentences.map((s) =>
          s.length > 200 ? s.substring(0, 200) + '...' : s,
        ),
      },
      safeSummary: nonSpoilerSummaries.length > 0
        ? nonSpoilerSummaries.join(' ')
        : content.description ?? 'Hozircha tavsif mavjud emas.',
      recommendation:
        spoilerReviews.length > 0
          ? `Diqqat! ${spoilerReviews.length} ta spoilerga ega sharh mavjud. Filmni ko'rishdan oldin ehtiyot bo'ling!`
          : 'Spolierlar mavjud emas. Xavfsiz ko\'rishingiz mumkin!',
    };
  }

  async generateSummary(contentId: string, contentType: 'movie' | 'series') {
    let content: any = null;

    if (contentType === 'movie') {
      content = await this.prisma.movie.findUnique({
        where: { id: contentId },
        include: {
          genres: { include: { genre: true } },
          countries: { include: { country: true } },
          reviews: {
            where: { isActive: true, spoiler: false },
            orderBy: { likes: 'desc' },
            take: 10,
          },
        },
      });
    } else {
      content = await this.prisma.series.findUnique({
        where: { id: contentId },
        include: {
          genres: { include: { genre: true } },
          countries: { include: { country: true } },
          reviews: {
            where: { isActive: true, spoiler: false },
            orderBy: { likes: 'desc' },
            take: 10,
          },
        },
      });
    }

    if (!content) {
      throw new NotFoundException(`${contentType === 'movie' ? 'Film' : 'Serial'} topilmadi`);
    }

    const genreNames = content.genres.map((g: any) => g.genre.name).join(', ');
    const countryNames = content.countries.map((c: any) => c.country.name).join(', ');

    const reviewSummaries = content.reviews
      .filter((r: any) => r.content)
      .map((r: any) => {
        const ratingText = r.rating ? ` (${r.rating}/10)` : '';
        return `${ratingText} ${r.content}`;
      });

    const avgRating =
      content.ratingCount > 0
        ? content.rating.toFixed(1)
        : 'Hali baho yo\'q';

    const sentiment =
      content.rating >= 8
        ? 'Juda yuqori baholangan'
        : content.rating >= 6
          ? 'Yaxshi baholangan'
          : content.rating >= 4
            ? 'O\'rtacha baholangan'
            : content.ratingCount > 0
              ? 'Past baholangan'
              : 'Baholar mavjud emas';

    const summary = {
      content: {
        id: content.id,
        title: content.title,
        originalTitle: content.originalTitle,
        contentType,
        year: content.year,
        duration: content.duration,
        ageRating: content.ageRating,
      },
      aiSummary: {
        overview:
          content.description ??
          `${content.title} — ${genreNames} janridagi ${
            contentType === 'movie' ? 'film' : 'serial'
          }. ${countryNames ? `Ishlab chiqarish: ${countryNames}.` : ''} ${content.year ? `Yil: ${content.year}.` : ''}`,
        genres: genreNames || 'Aniqlanmagan',
        countries: countryNames || 'Aniqlanmagan',
        sentiment,
        averageRating: avgRating,
        totalReviews: content.reviews.length,
        ratingDistribution: {
          totalRatings: content.ratingCount,
          averageScore: content.rating,
        },
        highlights: reviewSummaries.slice(0, 3),
        recommended:
          content.rating >= 7 && content.ratingCount >= 10
            ? true
            : content.ratingCount < 5
              ? null
              : false,
      },
    };

    return summary;
  }

  async trackRecommendation(
    userId: string,
    contentId: string,
    contentType: 'movie' | 'series',
    score: number,
    reason?: string,
    type: string = 'content_based',
  ) {
    const existing = await this.prisma.aIRecommendation.findFirst({
      where: {
        userId,
        ...(contentType === 'movie' ? { movieId: contentId } : { seriesId: contentId }),
      },
    });

    if (existing) {
      return this.prisma.aIRecommendation.update({
        where: { id: existing.id },
        data: { score, reason, type },
      });
    }

    return this.prisma.aIRecommendation.create({
      data: {
        userId,
        ...(contentType === 'movie' ? { movieId: contentId } : { seriesId: contentId }),
        score,
        reason,
        type,
      },
    });
  }

  async getTrendingPredictions(limit: number = 20) {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [recentMovies, weeklyMovies] = await Promise.all([
      this.prisma.movie.findMany({
        where: {
          isActive: true,
          createdAt: { lte: oneDayAgo },
        },
        select: {
          id: true,
          title: true,
          slug: true,
          poster: true,
          year: true,
          rating: true,
          ratingCount: true,
          viewCount: true,
          createdAt: true,
        },
        orderBy: { viewCount: 'desc' },
        take: 100,
      }),
      this.prisma.movie.findMany({
        where: {
          isActive: true,
          createdAt: { lte: sevenDaysAgo },
        },
        select: {
          id: true,
          title: true,
          slug: true,
          poster: true,
          year: true,
          rating: true,
          viewCount: true,
        },
        orderBy: { viewCount: 'desc' },
        take: 100,
      }),
    ]);

    const weeklyMap = new Map<string, number>();
    for (const m of weeklyMovies) {
      weeklyMap.set(m.id, m.viewCount);
    }

    const recentMap = new Map<string, number>();
    for (const m of recentMovies) {
      recentMap.set(m.id, m.viewCount);
    }

    const trending: TrendingMovie[] = [];

    for (const movie of recentMovies) {
      const totalViews = movie.viewCount;
      const weeklyViews = weeklyMap.get(movie.id) ?? 0;
      const recentViews = totalViews - weeklyViews;

      const dailyAvgWeekly = weeklyViews / 7;
      const velocity = dailyAvgWeekly > 0 ? recentViews / Math.max(dailyAvgWeekly, 1) : recentViews > 0 ? 10 : 0;

      let trendDirection: 'rising' | 'stable' | 'declining' = 'stable';
      if (velocity > 1.5) trendDirection = 'rising';
      else if (velocity < 0.5) trendDirection = 'declining';

      const trendScore =
        velocity * 30 +
        Math.min(totalViews / 1000, 20) +
        (movie.rating / 10) * 20 +
        Math.min(movie.ratingCount / 100, 10);

      trending.push({
        id: movie.id,
        title: movie.title,
        slug: movie.slug,
        poster: movie.poster,
        year: movie.year,
        rating: movie.rating,
        totalViews,
        recentViews,
        velocity: Math.round(velocity * 100) / 100,
        trendScore: Math.round(trendScore * 100) / 100,
        trendDirection,
      });
    }

    trending.sort((a, b) => b.trendScore - a.trendScore);

    const [recentSeries, weeklySeries] = await Promise.all([
      this.prisma.series.findMany({
        where: {
          isActive: true,
          createdAt: { lte: oneDayAgo },
        },
        select: {
          id: true,
          title: true,
          slug: true,
          poster: true,
          year: true,
          rating: true,
          ratingCount: true,
          viewCount: true,
        },
        orderBy: { viewCount: 'desc' },
        take: 100,
      }),
      this.prisma.series.findMany({
        where: {
          isActive: true,
          createdAt: { lte: sevenDaysAgo },
        },
        select: {
          id: true,
          title: true,
          slug: true,
          poster: true,
          year: true,
          rating: true,
          viewCount: true,
        },
        orderBy: { viewCount: 'desc' },
        take: 100,
      }),
    ]);

    const weeklySeriesMap = new Map<string, number>();
    for (const s of weeklySeries) {
      weeklySeriesMap.set(s.id, s.viewCount);
    }

    const recentSeriesMap = new Map<string, number>();
    for (const s of recentSeries) {
      recentSeriesMap.set(s.id, s.viewCount);
    }

    const trendingSeries: TrendingSeries[] = [];

    for (const series of recentSeries) {
      const totalViews = series.viewCount;
      const weeklyViews = weeklySeriesMap.get(series.id) ?? 0;
      const recentViews = totalViews - weeklyViews;

      const dailyAvgWeekly = weeklyViews / 7;
      const velocity = dailyAvgWeekly > 0 ? recentViews / Math.max(dailyAvgWeekly, 1) : recentViews > 0 ? 10 : 0;

      let trendDirection: 'rising' | 'stable' | 'declining' = 'stable';
      if (velocity > 1.5) trendDirection = 'rising';
      else if (velocity < 0.5) trendDirection = 'declining';

      const trendScore =
        velocity * 30 +
        Math.min(totalViews / 1000, 20) +
        (series.rating / 10) * 20 +
        Math.min(series.ratingCount / 100, 10);

      trendingSeries.push({
        id: series.id,
        title: series.title,
        slug: series.slug,
        poster: series.poster,
        year: series.year,
        rating: series.rating,
        totalViews,
        recentViews,
        velocity: Math.round(velocity * 100) / 100,
        trendScore: Math.round(trendScore * 100) / 100,
        trendDirection,
      });
    }

    trendingSeries.sort((a, b) => b.trendScore - a.trendScore);

    return {
      movies: trending.slice(0, limit),
      series: trendingSeries.slice(0, limit),
      generatedAt: new Date(),
    };
  }

  private parseNaturalLanguage(query: string): ParsedQuery {
    const normalizedQuery = query.toLowerCase().trim();
    const genres: string[] = [];
    const actors: string[] = [];
    let year: number | undefined;
    const keywords: string[] = [];

    const yearPatterns = [
      /(\d{4})\s*(yilgi|yil|год|года|year|ning)/i,
      /(\d{4})\s*-/i,
      /\b(20[0-2]\d|19[5-9]\d)\b/,
    ];

    for (const pattern of yearPatterns) {
      const match = normalizedQuery.match(pattern);
      if (match) {
        const y = parseInt(match[1], 10);
        if (y >= 1900 && y <= 2030) {
          year = y;
          break;
        }
      }
    }

    const genreKeywords: Record<string, string[]> = {
      comedy: ['komediya', 'comedy', 'kulgili', '搞笑', 'комедия', 'funny', 'humor'],
      horror: ['xorror', 'horror', 'qo\'rqinchli', '恐怖', 'ужас', 'scary'],
      action: ['harakat', 'action', 'ekshn', '动作', 'экшн'],
      drama: ['drama', 'dramatik', 'драма', '剧情'],
      romance: ['romantik', 'romance', 'love', 'romantik', 'романтика', 'love story'],
      thriller: ['thriller', 'triller', 'триллер'],
      adventure: ['sarguzasht', 'adventure', 'приключение', '冒险'],
      sciFi: ['fantastika', 'fantastik', 'sci-fi', 'science fiction', 'фантастика', '科幻'],
      documentary: ['documentary', 'hujjatli', 'документальный'],
      animation: ['multfilm', 'animation', 'анимация'],
      crime: ['jinoyat', 'crime', 'криминал'],
      mystery: ['sirli', 'mystery', 'детектив'],
      family: ['oila', 'family', 'семейный'],
      war: ['urush', 'war', 'война'],
      western: ['vestern', 'western'],
      fantasy: ['fantaziya', 'fantasy', 'фэнтези'],
      sport: ['sport', 'спорт'],
      music: ['musiqa', 'music', 'musical'],
      history: ['tarix', 'history', 'история'],
    };

    for (const [genreName, keywords_list] of Object.entries(genreKeywords)) {
      for (const kw of keywords_list) {
        if (normalizedQuery.includes(kw)) {
          genres.push(genreName);
          break;
        }
      }
    }

    const actorPatterns = [
      /with\s+(.+?)(?:\s+(?:movie|film|comedy|action|drama|horror|series|\d{4})|$)/i,
      /bilan\s+(.+?)(?:\s+(?:film|serial|kino|\d{4})|$)/i,
      /акт[ёе]р\w*\s+(.+?)(?:\s+(?:фильм|сериал|\d{4})|$)/i,
      /actor\s+(.+?)(?:\s+(?:movie|film|\d{4})|$)/i,
      / starring\s+(.+?)(?:\s+(?:movie|film|\d{4})|$)/i,
      / featuring\s+(.+?)(?:\s+(?:movie|film|\d{4})|$)/i,
    ];

    for (const pattern of actorPatterns) {
      const match = normalizedQuery.match(pattern);
      if (match) {
        const actorName = match[1].trim();
        if (actorName.length > 1) {
          actors.push(actorName);
        }
      }
    }

    if (actors.length === 0) {
      const namePatterns = [
        /(?:with|bilan|акт[ёе]р|actor|starring|featuring)\s+([A-Za-z\u0400-\u04FF\u00C0-\u024F]+(?:\s+[A-Za-z\u0400-\u04FF\u00C0-\u024F]+){0,2})/i,
      ];

      for (const pattern of namePatterns) {
        const match = normalizedQuery.match(pattern);
        if (match) {
          actors.push(match[1].trim());
        }
      }
    }

    const stopWords = new Set([
      'film', 'kino', 'movie', 'serial', 'series', 'ko\'rish',
      'chiqarish', 'yil', 'yilgi', 'qidirish', 'search', 'find',
      'bir', 'edi', 'bor', 'haqida', 'undan', 'shunday', 'movie',
      'the', 'a', 'an', 'is', 'it', 'of', 'in', 'on', 'at', 'to',
      'and', 'or', 'with', 'that', 'this', 'for', 'from', 'by',
      'фильм', 'сериал', 'год', 'года', 'про', 'найти', 'нужен',
    ]);

    const words = normalizedQuery.split(/\s+/);
    for (const word of words) {
      const cleaned = word.replace(/[^a-zA-Z0-9\u0400-\u04FF\u00C0-\u024F]/g, '');
      if (cleaned.length < 2) continue;
      if (stopWords.has(cleaned.toLowerCase())) continue;
      if (actors.some((a) => a.toLowerCase().includes(cleaned.toLowerCase()))) continue;
      if (genres.some((g) => g.toLowerCase() === cleaned.toLowerCase())) continue;
      if (year && cleaned === String(year)) continue;
      keywords.push(cleaned);
    }

    return { genres, actors, year, keywords };
  }

  private extractKeywords(description: string): string[] {
    const normalized = description
      .toLowerCase()
      .replace(/[''`]/g, "'")
      .replace(/[^\w\s\u0400-\u04FF\u00C0-\u024F']/g, ' ');

    const stopWords = new Set([
      'bir', 'edi', 'bor', 'haqida', 'undan', 'shunday', 'film',
      'kino', 'movie', 'serial', 'series', 'qachon', 'qayerda',
      'kim', 'nima', 'bunday', 'turli', 'tarixi', 'yangi', 'eski',
      'the', 'a', 'an', 'is', 'it', 'of', 'in', 'on', 'at', 'to',
      'and', 'or', 'that', 'this', 'was', 'were', 'about', 'from',
      'with', 'his', 'her', 'its', 'they', 'them', 'who', 'what',
      'where', 'when', 'how', 'there', 'their', 'been', 'have',
      'has', 'had', 'but', 'not', 'are', 'was', 'will', 'can',
      'фильм', 'сериал', 'про', 'это', 'его', 'она', 'они',
    ]);

    const words = normalized.split(/\s+/);
    const keywords: string[] = [];

    for (const word of words) {
      const cleaned = word.trim();
      if (cleaned.length < 3) continue;
      if (stopWords.has(cleaned)) continue;
      keywords.push(cleaned);
    }

    const uniqueKeywords = [...new Set(keywords)];
    return uniqueKeywords.slice(0, 15);
  }
}
