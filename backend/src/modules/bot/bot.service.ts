import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf, Context, Markup } from 'telegraf';
import { PrismaService } from '../../config/prisma.service';
import { MoviesService } from '../movies/movies.service';
import { SeriesService } from '../series/series.service';
import { UsersService } from '../users/users.service';
import { SearchService } from '../search/search.service';
import { FavoritesService } from '../favorites/favorites.service';
import { HistoryService } from '../history/history.service';
import { GamificationService } from '../gamification/gamification.service';

const GENRE_EMOJI_MAP: Record<string, string> = {
  action: '💥',
  adventure: '🗺️',
  comedy: '😂',
  crime: '🔫',
  drama: '🎭',
  family: '👨‍👩‍👧‍👦',
  fantasy: '🧙',
  horror: '👻',
  mystery: '🔍',
  romance: '💕',
  'sci-fi': '🚀',
  thriller: '🔪',
  war: '⚔️',
  western: '🤠',
  animation: '🎨',
  documentary: '📽️',
  music: '🎵',
  history: '📜',
  biography: '📖',
  sport: '⚽',
  superhero: '🦸',
  martial_arts: '🥋',
};

const TIER_EMOJI: Record<string, string> = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '💎',
};

const SPIN_WHEEL_DISPLAY = [
  '🪙 +10',
  '🪙 +25',
  '🪙 +50',
  '🪙 +100',
  '🪙 +250',
  '🪙 +500',
  '⭐ +10 XP',
  '⭐ +25 XP',
  '⭐ +50 XP',
  '⭐ +100 XP',
  '👑 Premium',
  '🎰 Try Again',
];

@Injectable()
export class BotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BotService.name);
  private bot: Telegraf | null = null;
  private botInfo: Record<string, any> | null = null;
  private updateCount = 0;
  private errorCount = 0;
  private startTime: Date = new Date();

  private readonly pendingSearches = new Map<number, 'search'>();
  private readonly pendingEpisodeSelection = new Map<number, { seriesId: string; seasonNumber: number }>();

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly moviesService: MoviesService,
    private readonly seriesService: SeriesService,
    private readonly usersService: UsersService,
    private readonly searchService: SearchService,
    private readonly favoritesService: FavoritesService,
    private readonly historyService: HistoryService,
    private readonly gamificationService: GamificationService,
  ) {}

  async onModuleInit() {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) {
      this.logger.warn('TELEGRAM_BOT_TOKEN not set — bot will not start');
      return;
    }

    this.bot = new Telegraf(token, { handlerTimeout: 30_000 });

    this.bot.catch((err: any) => {
      this.logger.error(`Telegraf error: ${err.message}`, err.stack);
      this.errorCount++;
    });

    this.registerCommands();
    this.registerCallbackHandlers();
    this.registerTextHandler();

    try {
      this.botInfo = await this.bot.telegram.getMe();
      this.logger.log(`Bot verified: @${this.botInfo.username} (${this.botInfo.id})`);
    } catch (error) {
      this.logger.error(`Failed to verify bot: ${error.message}`);
    }

    try {
      await this.bot.telegram.setMyCommands([
        { command: 'start', description: '🏠 Bosh menyu' },
        { command: 'search', description: '🔍 Film qidirish' },
        { command: 'random', description: '🎲 Tasodifiy film' },
        { command: 'new', description: '🆕 Yangi filmlar' },
        { command: 'top', description: '⭐ Top reyting' },
        { command: 'trending', description: '🔥 Trend filmlar' },
        { command: 'series', description: '📺 Seryarlar' },
        { command: 'categories', description: '📂 Kategoriyalar' },
        { command: 'profile', description: '👤 Mening profilim' },
        { command: 'favorites', description: '❤️ Sevimlilar' },
        { command: 'history', description: '📜 Tarix' },
        { command: 'bonus', description: '🎁 Kundalik bonus' },
        { command: 'missions', description: '🎯 Missiyalar' },
        { command: 'spin', description: '🎡 Spin Wheel' },
        { command: 'leaderboard', description: '🏆 Reyting' },
        { command: 'premium', description: '💎 Premium' },
        { command: 'lang', description: '🌐 Tilni o\'zgartirish' },
        { command: 'help', description: 'ℹ️ Yordam' },
      ]);
      this.logger.log('Bot commands registered in Telegram');
    } catch (error) {
      this.logger.warn(`Failed to set bot commands: ${error.message}`);
    }

    this.bot.launch({ dropPendingUpdates: true }).then(() => {
      this.logger.log(`Bot launched with long polling`);
    }).catch((error) => {
      this.logger.warn(`Bot launch failed (webhook mode available): ${error.message}`);
    });
  }

  async onModuleDestroy() {
    if (this.bot) {
      this.bot.stop('SIGTERM');
      this.logger.log('Bot stopped');
    }
  }

  async handleUpdate(update: Record<string, any>) {
    if (!this.bot) return;
    this.updateCount++;
    await this.bot.handleUpdate(update as any);
  }

  getBotInfo() {
    return this.botInfo;
  }

  getStats() {
    return {
      status: this.bot ? 'running' : 'stopped',
      botInfo: this.botInfo,
      uptime: Math.floor((Date.now() - this.startTime.getTime()) / 1000),
      totalUpdates: this.updateCount,
      totalErrors: this.errorCount,
      startedAt: this.startTime.toISOString(),
    };
  }

  async setWebhook(url: string, secretToken?: string) {
    if (!this.bot) {
      throw new Error('Bot not initialized');
    }

    try {
      await this.bot.telegram.setWebhook(url, {
        secret_token: secretToken,
        allowed_updates: ['message', 'callback_query', 'inline_query'],
      });
      return { ok: true, url, message: `Webhook set to ${url}` };
    } catch (error) {
      this.logger.error(`Failed to set webhook: ${error.message}`);
      return { ok: false, message: error.message };
    }
  }

  private registerCommands() {
    if (!this.bot) return;

    this.bot.start(async (ctx) => {
      await this.ensureUser(ctx);
      await this.sendHome(ctx);
    });

    this.bot.command('help', async (ctx) => {
      await this.sendHelp(ctx);
    });

    this.bot.command('search', async (ctx) => {
      const query = ctx.message.text.replace('/search', '').trim();
      if (query) {
        await this.handleSearch(ctx, query);
      } else {
        await this.askForSearch(ctx);
      }
    });

    this.bot.command('random', async (ctx) => {
      await this.handleRandomMovie(ctx);
    });

    this.bot.command('categories', async (ctx) => {
      await this.sendCategoryList(ctx);
    });

    this.bot.command('new', async (ctx) => {
      await this.handleNewMovies(ctx);
    });

    this.bot.command('top', async (ctx) => {
      await this.handleTopRated(ctx);
    });

    this.bot.command('trending', async (ctx) => {
      await this.handleTrending(ctx);
    });

    this.bot.command('series', async (ctx) => {
      await this.handleSeries(ctx);
    });

    this.bot.command('movies', async (ctx) => {
      await this.handleMovies(ctx);
    });

    this.bot.command('anime', async (ctx) => {
      await this.handleAnime(ctx);
    });

    this.bot.command('cartoons', async (ctx) => {
      await this.handleCartoons(ctx);
    });

    this.bot.command('profile', async (ctx) => {
      await this.sendProfile(ctx);
    });

    this.bot.command('favorites', async (ctx) => {
      await this.handleFavorites(ctx);
    });

    this.bot.command('history', async (ctx) => {
      await this.handleHistory(ctx);
    });

    this.bot.command('bonus', async (ctx) => {
      await this.handleDailyBonus(ctx);
    });

    this.bot.command('missions', async (ctx) => {
      await this.handleMissions(ctx);
    });

    this.bot.command('spin', async (ctx) => {
      await this.handleSpinWheel(ctx);
    });

    this.bot.command('leaderboard', async (ctx) => {
      await this.handleLeaderboard(ctx);
    });

    this.bot.command('premium', async (ctx) => {
      await this.handlePremium(ctx);
    });

    this.bot.command('lang', async (ctx) => {
      await this.handleLanguage(ctx);
    });
  }

  private registerCallbackHandlers() {
    if (!this.bot) return;

    this.bot.action('search', async (ctx) => {
      await ctx.answerCbQuery();
      await this.askForSearch(ctx);
    });

    this.bot.action('random_movie', async (ctx) => {
      await ctx.answerCbQuery('🎲 Tasodifiy film tanlanmoqda...');
      await this.handleRandomMovie(ctx);
    });

    this.bot.action('categories', async (ctx) => {
      await ctx.answerCbQuery();
      await this.sendCategoryList(ctx);
    });

    this.bot.action('help', async (ctx) => {
      await ctx.answerCbQuery();
      await this.sendHelp(ctx);
    });

    this.bot.action('new_movies', async (ctx) => {
      await ctx.answerCbQuery();
      await this.handleNewMovies(ctx);
    });

    this.bot.action('top_rated', async (ctx) => {
      await ctx.answerCbQuery();
      await this.handleTopRated(ctx);
    });

    this.bot.action('trending', async (ctx) => {
      await ctx.answerCbQuery();
      await this.handleTrending(ctx);
    });

    this.bot.action('series', async (ctx) => {
      await ctx.answerCbQuery();
      await this.handleSeries(ctx);
    });

    this.bot.action('movies', async (ctx) => {
      await ctx.answerCbQuery();
      await this.handleMovies(ctx);
    });

    this.bot.action('anime', async (ctx) => {
      await ctx.answerCbQuery();
      await this.handleAnime(ctx);
    });

    this.bot.action('cartoons', async (ctx) => {
      await ctx.answerCbQuery();
      await this.handleCartoons(ctx);
    });

    this.bot.action('profile', async (ctx) => {
      await ctx.answerCbQuery();
      await this.sendProfile(ctx);
    });

    this.bot.action('favorites', async (ctx) => {
      await ctx.answerCbQuery();
      await this.handleFavorites(ctx);
    });

    this.bot.action('history', async (ctx) => {
      await ctx.answerCbQuery();
      await this.handleHistory(ctx);
    });

    this.bot.action('daily_bonus', async (ctx) => {
      await ctx.answerCbQuery('🎁 Bonus olinmoqda...');
      await this.handleDailyBonus(ctx);
    });

    this.bot.action('missions', async (ctx) => {
      await ctx.answerCbQuery();
      await this.handleMissions(ctx);
    });

    this.bot.action('spin_wheel', async (ctx) => {
      await ctx.answerCbQuery('🎡 Aylantirilmoqda...');
      await this.handleSpinWheel(ctx);
    });

    this.bot.action('leaderboard', async (ctx) => {
      await ctx.answerCbQuery();
      await this.handleLeaderboard(ctx);
    });

    this.bot.action('premium', async (ctx) => {
      await ctx.answerCbQuery();
      await this.handlePremium(ctx);
    });

    this.bot.action('language', async (ctx) => {
      await ctx.answerCbQuery();
      await this.handleLanguage(ctx);
    });

    this.bot.action('back_to_start', async (ctx) => {
      await ctx.answerCbQuery();
      await this.sendHome(ctx);
    });

    this.bot.action(/^get_(\d+)$/, async (ctx) => {
      await ctx.answerCbQuery();
      const code = parseInt(ctx.match[1], 10);
      await this.handleGetByCode(ctx, code);
    });

    this.bot.action(/^dl_(\d+)$/, async (ctx) => {
      await ctx.answerCbQuery('📥 Film yuborilmoqda...');
      const code = parseInt(ctx.match[1], 10);
      await this.handleDownload(ctx, code);
    });

    this.bot.action(/^epdl_(.+)$/, async (ctx) => {
      await ctx.answerCbQuery('📥 Qism yuborilmoqda...');
      const episodeId = ctx.match[1];
      await this.handleEpisodeDownload(ctx, episodeId);
    });

    this.bot.action(/^cat_(.+)$/, async (ctx) => {
      await ctx.answerCbQuery();
      const genreSlug = ctx.match[1];
      await this.handleCategoryMovies(ctx, genreSlug);
    });

    this.bot.action(/^series_(.+)$/, async (ctx) => {
      await ctx.answerCbQuery();
      const seriesId = ctx.match[1];
      await this.handleSeriesDetail(ctx, seriesId);
    });

    this.bot.action(/^season_(.+?)_(\d+)$/, async (ctx) => {
      await ctx.answerCbQuery();
      const seriesId = ctx.match[1];
      const seasonNumber = parseInt(ctx.match[2], 10);
      await this.handleSeasonEpisodes(ctx, seriesId, seasonNumber);
    });

    this.bot.action(/^episode_(.+?)_(\d+)$/, async (ctx) => {
      await ctx.answerCbQuery();
      const seriesId = ctx.match[1];
      const seasonNumber = parseInt(ctx.match[2], 10);
      this.pendingEpisodeSelection.set(ctx.from.id, { seriesId, seasonNumber });
      await this.askForEpisodeNumber(ctx, seriesId, seasonNumber);
    });

    this.bot.action(/^ep_(.+?)_(\d+)_s(\d+)$/, async (ctx) => {
      await ctx.answerCbQuery();
      const episodeId = ctx.match[1];
      const episodeNumber = parseInt(ctx.match[2], 10);
      const seasonNumber = parseInt(ctx.match[3], 10);
      await this.handleEpisodeAction(ctx, episodeId, episodeNumber, seasonNumber);
    });

    this.bot.action(/^fav_(.+)$/, async (ctx) => {
      await ctx.answerCbQuery();
      const movieId = ctx.match[1];
      await this.handleToggleFavorite(ctx, movieId);
    });

    this.bot.action(/^share_(.+)$/, async (ctx) => {
      await ctx.answerCbQuery();
      const code = ctx.match[1];
      await this.handleShare(ctx, code);
    });

    this.bot.action(/^mission_claim_(.+)$/, async (ctx) => {
      await ctx.answerCbQuery();
      const missionId = ctx.match[1];
      await this.handleClaimMission(ctx, missionId);
    });

    this.bot.action(/^lang_(.+)$/, async (ctx) => {
      await ctx.answerCbQuery();
      const lang = ctx.match[1];
      await this.handleSetLanguage(ctx, lang);
    });

    this.bot.action(/^episodes_(.+?)_s(\d+)$/, async (ctx) => {
      await ctx.answerCbQuery();
      const seriesId = ctx.match[1];
      const seasonNumber = parseInt(ctx.match[2], 10);
      await this.handleSeasonEpisodes(ctx, seriesId, seasonNumber);
    });
  }

  private registerTextHandler() {
    if (!this.bot) return;

    this.bot.on('text', async (ctx) => {
      const userId = ctx.from.id;

      if (this.pendingSearches.has(userId)) {
        this.pendingSearches.delete(userId);
        const query = ctx.message.text.trim();
        if (query.length < 1) {
          await ctx.reply('❗ Iltimos, qidirish so\'rozini kiriting.');
          return;
        }
        await this.handleSearch(ctx, query);
        return;
      }

      if (this.pendingEpisodeSelection.has(userId)) {
        const pending = this.pendingEpisodeSelection.get(userId)!;
        this.pendingEpisodeSelection.delete(userId);
        const epNum = parseInt(ctx.message.text.trim(), 10);
        if (isNaN(epNum) || epNum < 1) {
          await ctx.reply('❗ Noto\'g\'ri raqam. Qaytadan kiriting.');
          return;
        }
        await this.handleEpisodeByNumber(ctx, pending.seriesId, pending.seasonNumber, epNum);
        return;
      }

      if (/^\d+$/.test(ctx.message.text.trim())) {
        const code = parseInt(ctx.message.text.trim(), 10);
        await this.handleGetByCode(ctx, code);
        return;
      }

      await this.handleSearch(ctx, ctx.message.text.trim());
    });
  }

  async sendHome(ctx: Context) {
    const user = await this.ensureUser(ctx);
    const name = user?.firstName || ctx.from?.first_name || 'Foydalanuvchi';
    const level = user?.level ?? 1;
    const coins = user?.coins ?? 0;

    const text =
      `🎬 <b>CinemaHub AI Ultimate</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `Salom, <b>${this.escapeHtml(name)}</b>! 👋\n\n` +
      `🏆 Level: <b>${level}</b>\n` +
      `🪙 Coins: <b>${coins}</b>\n\n` +
      `Kino, serial, anime va multfilmlarni kashf eting!\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `👇 Quyidagi tugmalardan foydalaning:`;

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('🔍 Qidirish', 'search'),
        Markup.button.callback('🎲 Tasodifiy', 'random_movie'),
      ],
      [
        Markup.button.callback('📂 Kategoriyalar', 'categories'),
        Markup.button.callback('🆕 Yangilar', 'new_movies'),
      ],
      [
        Markup.button.callback('⭐ Top reyting', 'top_rated'),
        Markup.button.callback('🔥 Trending', 'trending'),
      ],
      [
        Markup.button.callback('📺 Seriallar', 'series'),
        Markup.button.callback('🎬 Filmlar', 'movies'),
      ],
      [
        Markup.button.callback('🎌 Animelar', 'anime'),
        Markup.button.callback('🎨 Multfilmlar', 'cartoons'),
      ],
      [
        Markup.button.callback('👤 Profil', 'profile'),
        Markup.button.callback('❤️ Sevimlilar', 'favorites'),
      ],
      [
        Markup.button.callback('📜 Tarix', 'history'),
        Markup.button.callback('🎁 Kunlik bonus', 'daily_bonus'),
      ],
      [
        Markup.button.callback('🎯 Missiyalar', 'missions'),
        Markup.button.callback('🎡 Spin Wheel', 'spin_wheel'),
      ],
      [
        Markup.button.callback('🏆 Reyting', 'leaderboard'),
        Markup.button.callback('💎 Premium', 'premium'),
      ],
      [
        Markup.button.callback('ℹ️ Yordam', 'help'),
        Markup.button.callback('🌐 Til', 'language'),
      ],
    ]);

    await this.replyOrEdit(ctx, text, keyboard);
  }

  private async sendHelp(ctx: Context) {
    const text =
      `ℹ️ <b>CinemaHub AI — Yordam</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `📌 <b>Buyruqlar:</b>\n` +
      `/start — Bosh menyu\n` +
      `/help — Yordam\n` +
      `/search <i>nom</i> — Kino qidirish\n` +
      `/random — Tasodifiy kino\n` +
      `/categories — Kategoriyalar\n` +
      `/new — Yangi kinolar\n` +
      `/top — Eng yaxshilari\n` +
      `/trending — Trendda\n` +
      `/series — Seriallar\n` +
      `/movies — Filmlar\n` +
      `/anime — Animelar\n` +
      `/cartoons — Multfilmlar\n` +
      `/profile — Profil\n` +
      `/favorites — Sevimlilar\n` +
      `/history — Ko\'rish tarixi\n` +
      `/bonus — Kunlik bonus\n` +
      `/missions — Missiyalar\n` +
      `/spin — Spin Wheel\n` +
      `/leaderboard — Reyting\n` +
      `/premium — Premium\n` +
      `/lang — Til o\'zgartirish\n\n` +
      `📝 <b>Kino kodini kiriting</b> (masalan: <code>1234</code>) — kino yuboriladi.\n\n` +
      `🔍 Qidirish uchun oddiy matn yozing yoki /search buyrug\'ini ishlating.\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🤖 @CinemaHubBot`;

    await this.replyOrEdit(ctx, text, this.backButton());
  }

  private async askForSearch(ctx: Context) {
    const text =
      `🔍 <b>Qidirish</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      ` kino nomini, aktyor yoki janrni kiriting:\n\n` +
      `💡 Masalan: <code>Inception</code>, <code>Tom Hanks</code>, <code>Comedy</code>`;

    await this.replyOrEdit(ctx, text, this.backButton());
    this.pendingSearches.set(ctx.from!.id, 'search');
  }

  private async handleSearch(ctx: Context, query: string) {
    try {
      const loadingMsg = await this.replyOrEdit(
        ctx,
        `🔍 <b>"${this.escapeHtml(query)}"</b> qidirilmoqda...`,
      );

      const result = await this.searchService.search(query, { page: 1, limit: 10 } as any);

      if (!result.data || result.data.length === 0) {
        const noResult =
          `🔍 <b>"${this.escapeHtml(query)}"</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `😔 Hech qanday natija topilmadi.\n\n` +
          `💡 Boshqa nom yoki so\'z bilan qidirib ko\'ring.`;

        await this.replyOrEdit(ctx, noResult, this.backButton(), loadingMsg);
        return;
      }

      const movies = result.data.filter((r: any) => r.contentType === 'movie').slice(0, 5);
      const series = result.data.filter((r: any) => r.contentType === 'series').slice(0, 5);

      let text =
        `🔍 <b>"${this.escapeHtml(query)}"</b> — ${result.total} ta natija\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━\n`;

      const keyboardButtons: any[][] = [];

      if (movies.length > 0) {
        text += `\n🎬 <b>Filmlar:</b>\n`;
        for (const movie of movies) {
          const rating = movie.rating > 0 ? ` ⭐${movie.rating.toFixed(1)}` : '';
          const year = movie.year ? ` (${movie.year})` : '';
          const genres = (movie.genres || [])
            .slice(0, 2)
            .map((g: any) => g.genre?.emoji || '')
            .join('');
          text += `\n🎬 <b>#${movie.code}</b> — ${this.escapeHtml(movie.title)}${year}${rating} ${genres}`;
          keyboardButtons.push([
            Markup.button.callback(
              `${movie.title.substring(0, 30)}`,
              `get_${movie.code}`,
            ),
          ]);
        }
      }

      if (series.length > 0) {
        text += `\n\n📺 <b>Seriallar:</b>\n`;
        for (const s of series) {
          const rating = s.rating > 0 ? ` ⭐${s.rating.toFixed(1)}` : '';
          const year = s.year ? ` (${s.year})` : '';
          const statusEmoji = (s as any).status === 'completed' ? '✅' : '🔄';
          text += `\n${statusEmoji} <b>#${s.code}</b> — ${this.escapeHtml(s.title)}${year}${rating}`;
          keyboardButtons.push([
            Markup.button.callback(
              `${s.title.substring(0, 30)}`,
              `series_${s.id}`,
            ),
          ]);
        }
      }

      if (keyboardButtons.length === 0) {
        keyboardButtons.push([Markup.button.callback('🏠 Bosh menyu', 'back_to_start')]);
      } else {
        keyboardButtons.push([Markup.button.callback('🏠 Bosh menyu', 'back_to_start')]);
      }

      await this.replyOrEdit(ctx, text, Markup.inlineKeyboard(keyboardButtons), loadingMsg);
    } catch (error) {
      this.logger.error(`Search error: ${error.message}`);
      await this.replyOrEdit(
        ctx,
        '❌ Qidirishda xatolik yuz berdi. Qaytadan urinib ko\'ring.',
        this.backButton(),
      );
    }
  }

  private async handleRandomMovie(ctx: Context) {
    try {
      const movie = await this.moviesService.getRandom();
      await this.sendMovie(ctx, movie);
    } catch (error) {
      this.logger.error(`Random movie error: ${error.message}`);
      await this.replyOrEdit(
        ctx,
        '😔 Hozircha kinolar mavjud emas.',
        this.backButton(),
      );
    }
  }

  private async sendCategoryList(ctx: Context) {
    const genres = await this.prisma.genre.findMany({
      include: {
        _count: { select: { movies: true, series: true } },
      },
      orderBy: { name: 'asc' },
    });

    let text =
      `📂 <b>Kategoriyalar</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `Kino janrini tanlang:\n`;

    const buttons: any[][] = [];

    for (const genre of genres) {
      const count = genre._count.movies + genre._count.series;
      const emoji = GENRE_EMOJI_MAP[genre.slug] || genre.emoji || '🎭';
      text += `\n${emoji} <b>${this.escapeHtml(genre.name)}</b> — ${count} ta`;

      buttons.push([
        Markup.button.callback(
          `${emoji} ${genre.name} (${count})`,
          `cat_${genre.slug}`,
        ),
      ]);
    }

    buttons.push([Markup.button.callback('🏠 Bosh menyu', 'back_to_start')]);

    await this.replyOrEdit(ctx, text, Markup.inlineKeyboard(buttons));
  }

  private async handleCategoryMovies(ctx: Context, genreSlug: string) {
    try {
      const genre = await this.prisma.genre.findFirst({
        where: { slug: genreSlug },
        include: { _count: { select: { movies: true } } },
      });

      if (!genre) {
        await ctx.reply('❌ Kategoriya topilmadi.');
        return;
      }

      const emoji = GENRE_EMOJI_MAP[genreSlug] || genre.emoji || '🎭';

      const result = await this.moviesService.getByGenre(genre.id, {
        page: 1,
        limit: 10,
        skip: 0,
      } as any);

      const movies = result.data || [];

      let text =
        `${emoji} <b>${this.escapeHtml(genre.name)}</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `Jami: ${result.total} ta kino\n`;

      const buttons: any[][] = [];

      for (const movie of movies) {
        const rating = movie.rating > 0 ? ` ⭐${movie.rating.toFixed(1)}` : '';
        const year = movie.year ? ` (${movie.year})` : '';
        text += `\n🎬 <b>#${movie.code}</b> — ${this.escapeHtml(movie.title)}${year}${rating}`;
        buttons.push([
          Markup.button.callback(
            `🎬 #${movie.code}`,
            `get_${movie.code}`,
          ),
        ]);
      }

      if (buttons.length === 0) {
        text += `\n\n😔 Bu kategoriyada hozircha kinolar yo\'q.`;
      }

      buttons.push([Markup.button.callback('📂 Kategoriyalar', 'categories')]);
      buttons.push([Markup.button.callback('🏠 Bosh menyu', 'back_to_start')]);

      await this.replyOrEdit(ctx, text, Markup.inlineKeyboard(buttons));
    } catch (error) {
      this.logger.error(`Category movies error: ${error.message}`);
      await this.replyOrEdit(ctx, '❌ Xatolik yuz berdi.', this.backButton());
    }
  }

  private async handleNewMovies(ctx: Context) {
    try {
      const movies = await this.moviesService.getNewReleases(10);
      await this.sendMovieList(ctx, movies, '🆕 <b>Yangi filmlar</b>');
    } catch (error) {
      this.logger.error(`New movies error: ${error.message}`);
      await this.replyOrEdit(ctx, '❌ Xatolik yuz berdi.', this.backButton());
    }
  }

  private async handleTopRated(ctx: Context) {
    try {
      const movies = await this.moviesService.getTopRated(10);
      await this.sendMovieList(ctx, movies, '⭐ <b>Top reytingli filmlar</b>');
    } catch (error) {
      this.logger.error(`Top rated error: ${error.message}`);
      await this.replyOrEdit(ctx, '❌ Xatolik yuz berdi.', this.backButton());
    }
  }

  private async handleTrending(ctx: Context) {
    try {
      const movies = await this.moviesService.getTrending(10);
      await this.sendMovieList(ctx, movies, '🔥 <b>Trending filmlar</b>');
    } catch (error) {
      this.logger.error(`Trending error: ${error.message}`);
      await this.replyOrEdit(ctx, '❌ Xatolik yuz berdi.', this.backButton());
    }
  }

  private async handleSeries(ctx: Context) {
    try {
      const seriesList = await this.seriesService.findAll({
        page: 1,
        limit: 10,
        skip: 0,
      } as any);

      let text =
        `📺 <b>Seriallar</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `Jami: ${seriesList.total} ta serial\n`;

      const buttons: any[][] = [];

      for (const s of seriesList.data) {
        const rating = s.rating > 0 ? ` ⭐${s.rating.toFixed(1)}` : '';
        const year = s.year ? ` (${s.year})` : '';
        const statusEmoji = s.status === 'completed' ? '✅' : '🔄';
        const genres = (s.genres || [])
          .slice(0, 2)
          .map((g: any) => g.genre?.emoji || '')
          .join('');
        text += `\n${statusEmoji} <b>#${s.code}</b> — ${this.escapeHtml(s.title)}${year}${rating} ${genres}`;
        buttons.push([
          Markup.button.callback(
            `${statusEmoji} ${s.title.substring(0, 35)}`,
            `series_${s.id}`,
          ),
        ]);
      }

      if (buttons.length === 0) {
        text += `\n\n😔 Hozircha seriallar yo\'q.`;
      }

      buttons.push([Markup.button.callback('🏠 Bosh menyu', 'back_to_start')]);

      await this.replyOrEdit(ctx, text, Markup.inlineKeyboard(buttons));
    } catch (error) {
      this.logger.error(`Series error: ${error.message}`);
      await this.replyOrEdit(ctx, '❌ Xatolik yuz berdi.', this.backButton());
    }
  }

  private async handleMovies(ctx: Context) {
    try {
      const result = await this.moviesService.findAll({
        page: 1,
        limit: 10,
        skip: 0,
      } as any);

      await this.sendMovieList(ctx, result.data, '🎬 <b>Filmlar</b>', result.total);
    } catch (error) {
      this.logger.error(`Movies list error: ${error.message}`);
      await this.replyOrEdit(ctx, '❌ Xatolik yuz berdi.', this.backButton());
    }
  }

  private async handleAnime(ctx: Context) {
    try {
      const animeGenre = await this.prisma.genre.findFirst({
        where: { slug: 'anime' },
      });

      if (!animeGenre) {
        await this.replyOrEdit(
          ctx,
          '🎌 Anime kategoriyasi topilmadi.',
          this.backButton(),
        );
        return;
      }

      const result = await this.moviesService.getByGenre(animeGenre.id, {
        page: 1,
        limit: 10,
        skip: 0,
      } as any);

      await this.sendMovieList(ctx, result.data, '🎌 <b>Anime</b>', result.total);
    } catch (error) {
      this.logger.error(`Anime error: ${error.message}`);
      await this.replyOrEdit(ctx, '❌ Xatolik yuz berdi.', this.backButton());
    }
  }

  private async handleCartoons(ctx: Context) {
    try {
      const cartoonGenre = await this.prisma.genre.findFirst({
        where: { slug: 'animation' },
      });

      if (!cartoonGenre) {
        await this.replyOrEdit(
          ctx,
          '🎨 Multfilm kategoriyasi topilmadi.',
          this.backButton(),
        );
        return;
      }

      const result = await this.moviesService.getByGenre(cartoonGenre.id, {
        page: 1,
        limit: 10,
        skip: 0,
      } as any);

      await this.sendMovieList(ctx, result.data, '🎨 <b>Multfilmlar</b>', result.total);
    } catch (error) {
      this.logger.error(`Cartoons error: ${error.message}`);
      await this.replyOrEdit(ctx, '❌ Xatolik yuz berdi.', this.backButton());
    }
  }

  async sendMovie(ctx: Context, movie: any) {
    const genres = (movie.genres || [])
      .map((g: any) => {
        const emoji = GENRE_EMOJI_MAP[g.genre?.slug] || g.genre?.emoji || '🎭';
        return `${emoji} ${g.genre?.name || ''}`;
      })
      .join(' · ');

    const countries = (movie.countries || [])
      .map((c: any) => `${c.country?.flag || ''} ${c.country?.name || ''}`)
      .join(', ');

    const actors = (movie.actors || [])
      .slice(0, 5)
      .map((a: any) => a.person?.name)
      .filter(Boolean)
      .join(', ');

    const directors = (movie.directors || [])
      .map((d: any) => d.person?.name)
      .filter(Boolean)
      .join(', ');

    const rating = movie.rating > 0
      ? `⭐ <b>Reyting:</b> ${movie.rating.toFixed(1)}/10 (${movie.ratingCount || 0} ovoz)`
      : '';

    const text =
      `🎬 <b>${this.escapeHtml(movie.title)}</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      (movie.originalTitle && movie.originalTitle !== movie.title
        ? `📝 <i>${this.escapeHtml(movie.originalTitle)}</i>\n\n`
        : '') +
      `🔢 <b>Kod:</b> <code>${movie.code}</code>\n` +
      (movie.year ? `📅 <b>Yil:</b> ${movie.year}\n` : '') +
      (movie.duration ? `⏱️ <b>Davomiyligi:</b> ${movie.duration} daqiqa\n` : '') +
      (movie.quality ? `📺 <b>Sifat:</b> ${movie.quality}\n` : '') +
      (movie.ageRating ? `🔞 <b>Yosh cheklovi:</b> ${movie.ageRating}\n` : '') +
      (rating ? `\n${rating}\n` : '') +
      (movie.likeCount != null ? `👍 ${movie.likeCount || 0} · 👎 ${movie.dislikeCount || 0} · 👁️ ${movie.viewCount || 0}\n` : '') +
      (genres ? `\n🎭 <b>Janrlar:</b> ${genres}\n` : '') +
      (countries ? `🌍 <b>Mamlakatlar:</b> ${countries}\n` : '') +
      (directors ? `\n🎬 <b>Rejissor:</b> ${this.escapeHtml(directors)}\n` : '') +
      (actors ? `🌟 <b>Aktyorlar:</b> ${this.escapeHtml(actors)}\n` : '') +
      (movie.description
        ? `\n📖 <b>Tavsif:</b>\n${this.escapeHtml(movie.description.substring(0, 500))}${movie.description.length > 500 ? '...' : ''}\n`
        : '') +
      `\n━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📤 Filmni do\'stlaringizga ulashing!`;

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback(
          '⬇️ Olish',
          `dl_${movie.code}`,
        ),
        Markup.button.callback(
          '❤️ Sevimli',
          `fav_${movie.id}`,
        ),
      ],
      [
        Markup.button.url(
          '📤 Ulashish',
          `https://t.me/share/url?url=https://cinemahub.ai/movie/${movie.code}&text=${encodeURIComponent(movie.title)}`,
        ),
      ],
      [Markup.button.callback('🏠 Bosh menyu', 'back_to_start')],
    ]);

    if (movie.poster) {
      await ctx.replyWithPhoto(
        { url: movie.poster },
        {
          caption: text,
          parse_mode: 'HTML',
          ...keyboard,
        },
      );
    } else {
      await this.replyOrEdit(ctx, text, keyboard);
    }
  }

  async sendSeries(ctx: Context, series: any) {
    const genres = (series.genres || [])
      .map((g: any) => {
        const emoji = GENRE_EMOJI_MAP[g.genre?.slug] || g.genre?.emoji || '🎭';
        return `${emoji} ${g.genre?.name || ''}`;
      })
      .join(' · ');

    const statusEmoji = series.status === 'completed' ? '✅' : series.status === 'cancelled' ? '❌' : '🔄';
    const statusText = series.status === 'completed'
      ? 'Tugallangan'
      : series.status === 'cancelled'
        ? 'Bekor qilingan'
        : 'Davom etmoqda';

    const text =
      `📺 <b>${this.escapeHtml(series.title)}</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      (series.originalTitle && series.originalTitle !== series.title
        ? `📝 <i>${this.escapeHtml(series.originalTitle)}</i>\n\n`
        : '') +
      `🔢 <b>Kod:</b> <code>${series.code}</code>\n` +
      (series.year ? `📅 <b>Yil:</b> ${series.year}\n` : '') +
      `${statusEmoji} <b>Holat:</b> ${statusText}\n` +
      `🎬 <b>Mavsumlar:</b> ${series.totalSeasons}\n` +
      `📺 <b>Qismlar:</b> ${series.totalEpisodes}\n` +
      (series.rating > 0
        ? `\n⭐ <b>Reyting:</b> ${series.rating.toFixed(1)}/10 (${series.ratingCount || 0} ovoz)\n`
        : '') +
      (genres ? `\n🎭 <b>Janrlar:</b> ${genres}\n` : '') +
      (series.description
        ? `\n📖 <b>Tavsif:</b>\n${this.escapeHtml(series.description.substring(0, 500))}${series.description.length > 500 ? '...' : ''}\n`
        : '');

    const seasons = series.seasons || [];
    const seasonButtons: any[] = [];
    for (const season of seasons) {
      seasonButtons.push(
        Markup.button.callback(
          `📁 ${season.title || `Mavsum ${season.number}`}`,
          `season_${series.id}_${season.number}`,
        ),
      );
    }

    const keyboardButtons: any[][] = [];

    if (seasonButtons.length > 0) {
      keyboardButtons.push(seasonButtons);
    }

    keyboardButtons.push([
      Markup.button.callback('❤️ Sevimli', `fav_${series.id}`),
      Markup.button.callback('🏠 Bosh menyu', 'back_to_start'),
    ]);

    if (series.poster) {
      await ctx.replyWithPhoto(
        { url: series.poster },
        {
          caption: text,
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard(keyboardButtons),
        },
      );
    } else {
      await this.replyOrEdit(ctx, text, Markup.inlineKeyboard(keyboardButtons));
    }
  }

  private async sendMovieList(ctx: Context, movies: any[], title: string, total?: number) {
    let text =
      `${title}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━\n` +
      (total !== undefined ? `\nJami: ${total} ta\n` : '\n');

    const buttons: any[][] = [];

    for (const movie of movies) {
      const rating = movie.rating > 0 ? ` ⭐${movie.rating.toFixed(1)}` : '';
      const year = movie.year ? ` (${movie.year})` : '';
      const genres = (movie.genres || [])
        .slice(0, 2)
        .map((g: any) => g.genre?.emoji || '')
        .join('');
      text += `\n🎬 <b>#${movie.code}</b> — ${this.escapeHtml(movie.title)}${year}${rating} ${genres}`;
      buttons.push([
        Markup.button.callback(
          `🎬 #${movie.code}`,
          `get_${movie.code}`,
        ),
      ]);
    }

    if (buttons.length === 0) {
      text += `\n\n😔 Hozircha mavjud emas.`;
    }

    buttons.push([Markup.button.callback('🏠 Bosh menyu', 'back_to_start')]);

    await this.replyOrEdit(ctx, text, Markup.inlineKeyboard(buttons));
  }

  private async handleGetByCode(ctx: Context, code: number) {
    try {
      const movie = await this.moviesService.findByCode(code);
      await this.sendMovie(ctx, movie);
    } catch (error) {
      this.logger.error(`Get movie by code error: ${error.message}`);
      await this.replyOrEdit(
        ctx,
        `❌ <b>#${code}</b> kodli film topilmadi.`,
        this.backButton(),
      );
    }
  }

  private async handleDownload(ctx: Context, code: number) {
    try {
      const movie = await this.moviesService.findByCode(code);
      const caption = `🎬 <b>${this.escapeHtml(movie.title)}</b>` +
        (movie.year ? ` (${movie.year})` : '');

      if (movie.channelMessageId && movie.channelId) {
        try {
          await ctx.telegram.copyMessage(
            ctx.chat!.id,
            String(movie.channelId),
            movie.channelMessageId,
            { caption, parse_mode: 'HTML' },
          );
          return;
        } catch (copyErr: any) {
          this.logger.warn(`copyMessage failed for code ${code}: ${copyErr.message}`);
        }
      }

      if (movie.telegramFileId) {
        try {
          await ctx.replyWithVideo(
            movie.telegramFileId as any,
            { caption, parse_mode: 'HTML' },
          );
          return;
        } catch (videoErr: any) {
          this.logger.warn(`sendVideo failed for code ${code}: ${videoErr.message}`);
        }
        try {
          await ctx.replyWithDocument(
            movie.telegramFileId as any,
            { caption, parse_mode: 'HTML' },
          );
          return;
        } catch (docErr: any) {
          this.logger.error(`sendDocument also failed for code ${code}: ${docErr.message}`);
        }
      }

      await ctx.reply('❌ Bu film fayli hozircha mavjud emas.');
    } catch (error: any) {
      this.logger.error(`Download error: ${error.message}`);
      await ctx.reply('❌ Film yuklab olishda xatolik yuz berdi.');
    }
  }

  private async handleEpisodeDownload(ctx: Context, episodeId: string) {
    try {
      const episode = await this.seriesService.getEpisode(episodeId) as any;
      const series = episode.season?.series;
      const caption = `📺 ${series?.title || 'Serial'} · S${episode.season?.number || '?'}E${episode.number}`;

      if (episode.channelMessageId && episode.channelId) {
        try {
          await ctx.telegram.copyMessage(
            ctx.chat!.id,
            String(episode.channelId),
            episode.channelMessageId,
            { caption, parse_mode: 'HTML' },
          );
          return;
        } catch (copyErr: any) {
          this.logger.warn(`copyMessage failed for episode ${episodeId}: ${copyErr.message}`);
        }
      }

      if (episode.telegramFileId) {
        try {
          await ctx.replyWithVideo(episode.telegramFileId as any, { caption });
          return;
        } catch (videoErr: any) {
          this.logger.warn(`sendVideo failed for episode ${episodeId}: ${videoErr.message}`);
        }
        try {
          await ctx.replyWithDocument(episode.telegramFileId as any, { caption });
          return;
        } catch (docErr: any) {
          this.logger.error(`sendDocument also failed for episode ${episodeId}: ${docErr.message}`);
        }
      }

      await ctx.reply('❌ Bu qism fayli hozircha mavjud emas.');
    } catch (error: any) {
      this.logger.error(`Episode download error: ${error.message}`);
      await ctx.reply('❌ Qismni yuklab olishda xatolik yuz berdi.');
    }
  }

  private async handleSeriesDetail(ctx: Context, seriesId: string) {
    try {
      const series = await this.seriesService.findById(seriesId);
      await this.sendSeries(ctx, series);
    } catch (error) {
      this.logger.error(`Series detail error: ${error.message}`);
      await this.replyOrEdit(ctx, '❌ Serial topilmadi.', this.backButton());
    }
  }

  private async handleSeasonEpisodes(ctx: Context, seriesId: string, seasonNumber: number) {
    try {
      const series = await this.seriesService.findById(seriesId);
      const season = (series.seasons || []).find(
        (s: any) => s.number === seasonNumber,
      );

      if (!season) {
        await ctx.reply('❌ Mavsum topilmadi.');
        return;
      }

      const seasonTitle = season.title || `Mavsum ${seasonNumber}`;
      let text =
        `📺 <b>${this.escapeHtml(series.title)}</b>\n` +
        `📁 <b>${this.escapeHtml(seasonTitle)}</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━\n`;

      const buttons: any[][] = [];

      const episodes = (season as any).episodes || [];
      for (const ep of episodes) {
        const duration = ep.duration ? ` (${ep.duration} min)` : '';
        text += `\n🎬 <b>${ep.number}.</b> ${this.escapeHtml(ep.title)}${duration}`;
        buttons.push([
          Markup.button.callback(
            `🎬 ${ep.number}. ${ep.title.substring(0, 30)}`,
            `ep_${ep.id}_${ep.number}_s${seasonNumber}`,
          ),
        ]);
      }

      if (buttons.length === 0) {
        text += `\n\n😔 Bu mavsumda hozircha qismlar yo\'q.`;
      }

      buttons.push([
        Markup.button.callback(
          `📺 ${series.title.substring(0, 30)}`,
          `series_${seriesId}`,
        ),
      ]);
      buttons.push([Markup.button.callback('🏠 Bosh menyu', 'back_to_start')]);

      await this.replyOrEdit(ctx, text, Markup.inlineKeyboard(buttons));
    } catch (error) {
      this.logger.error(`Season episodes error: ${error.message}`);
      await this.replyOrEdit(ctx, '❌ Xatolik yuz berdi.', this.backButton());
    }
  }

  private async askForEpisodeNumber(ctx: Context, seriesId: string, seasonNumber: number) {
    const text =
      `📺 <b>Qism raqamini kiriting</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `Mavsum ${seasonNumber} dagi qism raqamini kiriting:\n\n` +
      `💡 Masalan: <code>1</code>, <code>5</code>, <code>12</code>`;

    await this.replyOrEdit(ctx, text, this.backButton());
  }

  private async handleEpisodeByNumber(ctx: Context, seriesId: string, seasonNumber: number, episodeNumber: number) {
    try {
      const series = await this.seriesService.findById(seriesId);
      const season = (series.seasons || []).find(
        (s: any) => s.number === seasonNumber,
      );

      if (!season) {
        await ctx.reply('❌ Mavsum topilmadi.');
        return;
      }

      const episode = ((season as any).episodes || []).find(
        (e: any) => e.number === episodeNumber,
      );

      if (!episode) {
        await ctx.reply(`❌ ${seasonNumber}-mavsumda ${episodeNumber}-qism topilmadi.`);
        return;
      }

      await this.handleEpisodeAction(ctx, episode.id, episodeNumber, seasonNumber);
    } catch (error) {
      this.logger.error(`Episode by number error: ${error.message}`);
      await this.replyOrEdit(ctx, '❌ Xatolik yuz berdi.', this.backButton());
    }
  }

  private async handleEpisodeAction(
    ctx: Context,
    episodeId: string,
    episodeNumber: number,
    seasonNumber: number,
  ) {
    try {
      const episode = await this.seriesService.getEpisode(episodeId);
      const series = episode.season?.series;

      const text =
        `📺 <b>${this.escapeHtml(series?.title || 'Serial')}</b>\n` +
        `📁 Mavsum ${seasonNumber} · 🎬 Qism ${episodeNumber}\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `📝 <b>${this.escapeHtml(episode.title)}</b>\n` +
        (episode.description
          ? `\n📖 ${this.escapeHtml(episode.description.substring(0, 300))}${episode.description.length > 300 ? '...' : ''}\n`
          : '') +
        (episode.duration ? `\n⏱️ <b>Davomiyligi:</b> ${episode.duration} daqiq\n` : '') +
        (episode.quality ? `📺 <b>Sifat:</b> ${episode.quality}\n` : '') +
        `\n━━━━━━━━━━━━━━━━━━━━━━━\n` +
        (episode.telegramFileId
          ? `✅ Film fayli mavjud`
          : episode.cloudUrl
            ? `☁️ Cloud havola mavjud`
            : '⏳ Hali yuklanmagan');

      const keyboardButtons: any[][] = [];

      if (episode.telegramFileId || episode.cloudUrl) {
        keyboardButtons.push([
          Markup.button.callback(
            '⬇️ Yuklab olish',
            `epdl_${episodeId}`,
          ),
        ]);
      }

      keyboardButtons.push([
        Markup.button.url(
          '📤 Ulashish',
          `https://t.me/share/url?url=https://cinemahub.ai/series/${series?.id}&text=${encodeURIComponent(`${series?.title} S${seasonNumber}E${episodeNumber}`)}`,
        ),
      ]);
      keyboardButtons.push([
        Markup.button.callback(
          `📺 ${series?.title?.substring(0, 30) || 'Serial'}`,
          `series_${series?.id}`,
        ),
      ]);
      keyboardButtons.push([Markup.button.callback('🏠 Bosh menyu', 'back_to_start')]);

      await this.replyOrEdit(ctx, text, Markup.inlineKeyboard(keyboardButtons));
    } catch (error) {
      this.logger.error(`Episode action error: ${error.message}`);
      await this.replyOrEdit(ctx, '❌ Qism topilmadi.', this.backButton());
    }
  }

  private async handleToggleFavorite(ctx: Context, contentId: string) {
    try {
      const userId = await this.getOrCreateUserId(ctx);
      if (!userId) {
        await ctx.reply('❌ Foydalanuvchi topilmadi.');
        return;
      }

      let result: any;
      try {
        result = await this.favoritesService.toggleFavorite(userId, contentId);
      } catch {
        try {
          result = await this.favoritesService.toggleSeriesFavorite(userId, contentId);
        } catch {
          result = { favorited: false, message: 'Mazmun topilmadi' };
        }
      }

      const emoji = result.favorited ? '❤️' : '💔';
      await ctx.answerCbQuery(`${emoji} ${result.message}`);
    } catch (error) {
      this.logger.error(`Toggle favorite error: ${error.message}`);
      await ctx.answerCbQuery('❌ Xatolik yuz berdi');
    }
  }

  private async handleShare(ctx: Context, code: string) {
    const shareUrl = `https://t.me/share/url?url=https://cinemahub.ai/movie/${code}&text=${encodeURIComponent('CinemaHub da kino ko\'ring!')}`;
    await ctx.reply(`📤 Ulashish havolasi:\n${shareUrl}`);
  }

  async sendProfile(ctx: Context) {
    try {
      const userId = await this.getOrCreateUserId(ctx);
      if (!userId) {
        await this.replyOrEdit(
          ctx,
          '❌ Profil topilmadi. /start ni bosing.',
          this.backButton(),
        );
        return;
      }

      const profile = await this.usersService.getProfile(userId);

      const levelProgress = ((profile.xp % 1000) / 1000) * 100;
      const progressBar = this.createProgressBar(levelProgress);

      const text =
        `👤 <b>Profil</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `🆔 <b>ID:</b> <code>${profile.telegramId}</code>\n` +
        (profile.username ? `📌 <b>Username:</b> @${profile.username}\n` : '') +
        `📛 <b>Ism:</b> ${this.escapeHtml(profile.firstName || 'Noma\'lum')}\n\n` +
        `🏆 <b>Level:</b> ${profile.level}\n` +
        `${progressBar}\n` +
        `⭐ <b>XP:</b> ${profile.xp} / ${(Math.floor(profile.xp / 1000) + 1) * 1000}\n\n` +
        `🪙 <b>Coins:</b> ${profile.coins}\n` +
        `🔥 <b>Streak:</b> ${profile.streakCount} kun\n\n` +
        `❤️ <b>Sevimlilar:</b> ${profile.favoritesCount}\n` +
        `👀 <b>Ko\'rilgan:</b> ${profile.watchHistoryCount}\n` +
        `📝 <b>Sharhlar:</b> ${profile.reviewsCount}\n` +
        `⏱️ <b>Ko\'rish vaqti:</b> ${profile.totalWatchTimeMinutes} daqiqa\n\n` +
        (profile.isPremium ? '💎 <b>Premium a\'zo</b>\n\n' : '') +
        (profile.achievements.length > 0
          ? `🏅 <b>Yutuqlar (${profile.achievements.length}):</b>\n` +
            profile.achievements
              .slice(0, 5)
              .map(
                (a) =>
                  `  ${TIER_EMOJI[a.tier] || '🏅'} ${this.escapeHtml(a.name)}`,
              )
              .join('\n') +
            '\n'
          : '') +
        `━━━━━━━━━━━━━━━━━━━━━━━`;

      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback('❤️ Sevimlilar', 'favorites'),
          Markup.button.callback('📜 Tarix', 'history'),
        ],
        [Markup.button.callback('🏠 Bosh menyu', 'back_to_start')],
      ]);

      if (profile.avatar) {
        await ctx.replyWithPhoto(
          { url: profile.avatar },
          { caption: text, parse_mode: 'HTML', ...keyboard },
        );
      } else {
        await this.replyOrEdit(ctx, text, keyboard);
      }
    } catch (error) {
      this.logger.error(`Profile error: ${error.message}`);
      await this.replyOrEdit(ctx, '❌ Profilni yuklashda xatolik.', this.backButton());
    }
  }

  private async handleFavorites(ctx: Context) {
    try {
      const userId = await this.getOrCreateUserId(ctx);
      if (!userId) {
        await this.replyOrEdit(ctx, '❌ Foydalanuvchi topilmadi.', this.backButton());
        return;
      }

      const result = await this.favoritesService.getUserFavorites(userId, {
        page: 1,
        limit: 10,
        skip: 0,
      } as any);

      let text =
        `❤️ <b>Sevimlilar</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `Jami: ${result.total} ta\n`;

      const buttons: any[][] = [];

      for (const fav of result.data) {
        if (fav.movie) {
          const m = fav.movie;
          const rating = m.rating > 0 ? ` ⭐${m.rating.toFixed(1)}` : '';
          const year = m.year ? ` (${m.year})` : '';
          text += `\n🎬 <b>#${m.code}</b> — ${this.escapeHtml(m.title)}${year}${rating}`;
          buttons.push([
            Markup.button.callback(
              `🎬 #${m.code}`,
              `get_${m.code}`,
            ),
          ]);
        } else if (fav.series) {
          const s = fav.series;
          const statusEmoji = s.status === 'completed' ? '✅' : '🔄';
          text += `\n${statusEmoji} <b>#${s.code}</b> — ${this.escapeHtml(s.title)}`;
          buttons.push([
            Markup.button.callback(
              `${statusEmoji} ${s.title.substring(0, 30)}`,
              `series_${s.id}`,
            ),
          ]);
        }
      }

      if (buttons.length === 0) {
        text += `\n\n😔 Sevimlilar ro\'yxati bo\'sh.\n kino yoki seriallarni ❤️ tugmasi bilan qo\'shing!`;
      }

      buttons.push([Markup.button.callback('🏠 Bosh menyu', 'back_to_start')]);

      await this.replyOrEdit(ctx, text, Markup.inlineKeyboard(buttons));
    } catch (error) {
      this.logger.error(`Favorites error: ${error.message}`);
      await this.replyOrEdit(ctx, '❌ Xatolik yuz berdi.', this.backButton());
    }
  }

  private async handleHistory(ctx: Context) {
    try {
      const userId = await this.getOrCreateUserId(ctx);
      if (!userId) {
        await this.replyOrEdit(ctx, '❌ Foydalanuvchi topilmadi.', this.backButton());
        return;
      }

      const result = await this.historyService.getWatchHistory(userId, {
        page: 1,
        limit: 10,
        skip: 0,
      } as any);

      let text =
        `📜 <b>Ko\'rish tarixi</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `Jami: ${result.total} ta\n`;

      const buttons: any[][] = [];

      for (const entry of result.data) {
        if (entry.movie) {
          const m = entry.movie;
          const progress = entry.duration > 0
            ? ` — ${Math.round((entry.progress / entry.duration) * 100)}%`
            : '';
          const status = entry.completed ? '✅' : '▶️';
          text += `\n${status} <b>#${m.code || '—'}</b> — ${this.escapeHtml(m.title)}${progress}`;
          if (m.code) {
            buttons.push([
              Markup.button.callback(
                `${status} ${m.title.substring(0, 30)}`,
                `get_${m.code}`,
              ),
            ]);
          }
        } else if (entry.episode) {
          const ep = entry.episode;
          const sTitle = ep.season?.series?.title || 'Serial';
          const progress = entry.duration > 0
            ? ` — ${Math.round((entry.progress / entry.duration) * 100)}%`
            : '';
          const status = entry.completed ? '✅' : '▶️';
          text += `\n${status} 📺 ${this.escapeHtml(sTitle)} S${ep.season?.number || '?'}E${ep.number}${progress}`;
          if (ep.season?.series?.id) {
            buttons.push([
              Markup.button.callback(
                `📺 ${sTitle.substring(0, 30)}`,
                `series_${ep.season.series.id}`,
              ),
            ]);
          }
        }
      }

      if (buttons.length === 0) {
        text += `\n\n😔 Tarix bo\'sh.`;
      }

      buttons.push([Markup.button.callback('🏠 Bosh menyu', 'back_to_start')]);

      await this.replyOrEdit(ctx, text, Markup.inlineKeyboard(buttons));
    } catch (error) {
      this.logger.error(`History error: ${error.message}`);
      await this.replyOrEdit(ctx, '❌ Xatolik yuz berdi.', this.backButton());
    }
  }

  private async handleDailyBonus(ctx: Context) {
    try {
      const userId = await this.getOrCreateUserId(ctx);
      if (!userId) {
        await this.replyOrEdit(ctx, '❌ Foydalanuvchi topilmadi.', this.backButton());
        return;
      }

      const bonus = await this.usersService.checkDailyBonus(userId);

      const text =
        `🎁 <b>Kunlik bonus olingan!</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `🪙 <b>+${bonus.bonus} coin</b>\n` +
        `🔥 <b>Streak:</b> ${bonus.streak} kun\n` +
        `💰 <b>Jami coinlar:</b> ${bonus.totalCoins}\n\n` +
        `📈 Har kuni kelsangiz, bonus ortadi!\n` +
        `1 kun = 100 · 2 kun = 200 · 7 kun = 700\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━`;

      await this.replyOrEdit(ctx, text, this.backButton());
    } catch (error) {
      this.logger.error(`Daily bonus error: ${error.message}`);
      const msg = error.message || 'Xatolik yuz berdi';
      if (msg.includes('already claimed')) {
        await this.replyOrEdit(
          ctx,
          '🎁 <b>Kunlik bonus</b>\n\n' +
            '⏰ Bonus allaqachon olingan.\n' +
            'Keyinroq qaytadan urinib ko\'ring!',
          this.backButton(),
        );
      } else {
        await this.replyOrEdit(ctx, `❌ ${msg}`, this.backButton());
      }
    }
  }

  private async handleMissions(ctx: Context) {
    try {
      const userId = await this.getOrCreateUserId(ctx);
      if (!userId) {
        await this.replyOrEdit(ctx, '❌ Foydalanuvchi topilmadi.', this.backButton());
        return;
      }

      const missions = await this.gamificationService.getMissions(userId);

      let text =
        `🎯 <b>Missiyalar</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━\n`;

      const buttons: any[][] = [];

      for (const mission of missions) {
        const progressPercent = Math.min(
          Math.round((mission.progress / mission.target) * 100),
          100,
        );
        const progressBar = this.createProgressBar(progressPercent);
        const statusIcon = mission.claimed
          ? '✅'
          : mission.completed
            ? '🎁'
            : '🔲';

        const typeEmoji = mission.type === 'daily' ? '📅' : mission.type === 'weekly' ? '📆' : '⭐';

        text += `\n${statusIcon} ${typeEmoji} <b>${this.escapeHtml(mission.name)}</b>\n`;
        text += `   ${this.escapeHtml(mission.description)}\n`;
        text += `   ${progressBar} ${mission.progress}/${mission.target}\n`;
        text += `   ⭐ +${mission.reward} XP` + (mission.coinReward > 0 ? ` · 🪙 +${mission.coinReward} Coins` : '') + '\n';

        if (mission.completed && !mission.claimed) {
          buttons.push([
            Markup.button.callback(
              `🎁 ${mission.name.substring(0, 35)} — Olish`,
              `mission_claim_${mission.id}`,
            ),
          ]);
        }
      }

      if (buttons.length === 0 && missions.every((m) => m.claimed)) {
        text += `\n\n🎉 Barcha missiyalar bajarildi!`;
      }

      buttons.push([Markup.button.callback('🏠 Bosh menyu', 'back_to_start')]);

      await this.replyOrEdit(ctx, text, Markup.inlineKeyboard(buttons));
    } catch (error) {
      this.logger.error(`Missions error: ${error.message}`);
      await this.replyOrEdit(ctx, '❌ Missiyalarni yuklashda xatolik.', this.backButton());
    }
  }

  private async handleClaimMission(ctx: Context, missionId: string) {
    try {
      const userId = await this.getOrCreateUserId(ctx);
      if (!userId) {
        await ctx.reply('❌ Foydalanuvchi topilmadi.');
        return;
      }

      const result = await this.gamificationService.claimMissionReward(userId, missionId);

      const text =
        `🎉 <b>Missiya bajarildi!</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `⭐ <b>+${result.xpEarned} XP</b>\n` +
        (result.coinsEarned > 0 ? `🪙 <b>+${result.coinsEarned} Coins</b>\n` : '') +
        `📊 <b>Jami XP:</b> ${result.totalXp}\n` +
        `🪙 <b>Jami Coins:</b> ${result.totalCoins}\n` +
        `🏆 <b>Level:</b> ${result.level}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━`;

      await ctx.answerCbQuery('✅ Mukofot olindi!');
      await this.replyOrEdit(ctx, text, this.backButton());
    } catch (error) {
      this.logger.error(`Claim mission error: ${error.message}`);
      await ctx.answerCbQuery(`❌ ${error.message}`);
    }
  }

  private async handleSpinWheel(ctx: Context) {
    try {
      const userId = await this.getOrCreateUserId(ctx);
      if (!userId) {
        await this.replyOrEdit(ctx, '❌ Foydalanuvchi topilmadi.', this.backButton());
        return;
      }

      const result = await this.gamificationService.getSpinWheelResult(userId);

      let spinDisplay = SPIN_WHEEL_DISPLAY.join(' → ');
      if (result.type !== 'nothing') {
        const winIndex = SPIN_WHEEL_DISPLAY.findIndex((s) => s.includes(result.label));
        if (winIndex >= 0) {
          spinDisplay =
            SPIN_WHEEL_DISPLAY.slice(0, winIndex).join('\n') +
            `\n\n>>> 🎯 ${SPIN_WHEEL_DISPLAY[winIndex]} <<<\n\n` +
            SPIN_WHEEL_DISPLAY.slice(winIndex + 1).join('\n');
        }
      }

      const prizeEmoji = result.type === 'coins'
        ? '🪙'
        : result.type === 'xp'
          ? '⭐'
          : result.type === 'premium_day'
            ? '👑'
            : '😤';

      const text =
        `🎡 <b>Spin Wheel natijasi</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `<pre>${spinDisplay}</pre>\n\n` +
        `${prizeEmoji} <b>${result.label}</b>\n\n` +
        `🎰 <b>Qolgan aylanishlar:</b> ${result.spinsRemaining}\n` +
        (result.nextSpinAt
          ? `⏰ <b>Keyingi aylanish:</b> ${new Date(result.nextSpinAt).toLocaleDateString('uz-UZ')}\n`
          : '') +
        `\n━━━━━━━━━━━━━━━━━━━━━━━`;

      const keyboardRows: any[][] = [];
      if (result.spinsRemaining > 0) {
        keyboardRows.push([Markup.button.callback('🎡 Yana aylantirish', 'spin_wheel')]);
      }
      keyboardRows.push([Markup.button.callback('🏠 Bosh menyu', 'back_to_start')]);
      const keyboard = Markup.inlineKeyboard(keyboardRows);

      await this.replyOrEdit(ctx, text, keyboard);
    } catch (error) {
      this.logger.error(`Spin wheel error: ${error.message}`);
      const msg = error.message || '';
      if (msg.includes('No spins remaining')) {
        await this.replyOrEdit(
          ctx,
          '🎡 <b>Spin Wheel</b>\n\n' +
            '⏰ Bugun barcha aylanishlaringiz tugadi.\n' +
            'Ertaga qaytadan urinib ko\'ring!\n\n' +
            '💎 Premium a\'zolar 5 ta aylanish oladi.',
          this.backButton(),
        );
      } else {
        await this.replyOrEdit(ctx, `❌ ${msg}`, this.backButton());
      }
    }
  }

  private async handleLeaderboard(ctx: Context) {
    try {
      const leaderboard = await this.usersService.getLeaderboard(10);

      let text =
        `🏆 <b>Top foydalanuvchilar</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━\n`;

      const medals = ['🥇', '🥈', '🥉'];

      for (const entry of leaderboard) {
        const rank = medals[entry.rank - 1] || `#${entry.rank}`;
        const name = entry.username
          ? `@${entry.username}`
          : entry.firstName || 'Noma\'lum';
        text += `\n${rank} <b>${this.escapeHtml(name)}</b>\n`;
        text += `   ⭐ ${entry.xp} XP · 🏆 Level ${entry.level} · 🪙 ${entry.coins}\n`;
      }

      if (leaderboard.length === 0) {
        text += `\n😔 Hozircha reyting bo\'sh.`;
      }

      text += `\n━━━━━━━━━━━━━━━━━━━━━━━`;

      await this.replyOrEdit(ctx, text, this.backButton());
    } catch (error) {
      this.logger.error(`Leaderboard error: ${error.message}`);
      await this.replyOrEdit(ctx, '❌ Reytingni yuklashda xatolik.', this.backButton());
    }
  }

  private async handlePremium(ctx: Context) {
    const text =
      `💎 <b>CinemaHub Premium</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `✨ <b>Premium imtiyozlar:</b>\n\n` +
      `🎬 4K va HDR sifatida kino ko\'rish\n` +
      `📺 Barcha seriallar va animelar\n` +
      `🎡 Kuniga 5 ta Spin Wheel aylanishi\n` +
      `⬇️ Tezkor yuklab olish\n` +
      `🚫 Reklamalarsiz\n` +
      `🌟 Maxsus kontentga kirish\n` +
      `🎯 Maxsus missiyalar va yutuqlar\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `💳 <b>Narxlar:</b>\n\n` +
      `📅 1 oy — 29,000 UZS\n` +
      `📅 3 oy — 69,000 UZS (-20%)\n` +
      `📅 12 oy — 199,000 UZS (-43%)\n` +
      `♾️ Umrbod — 499,000 UZS\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🔐 To\'lov uchun @shakh_041 ga yozing`;

    await this.replyOrEdit(ctx, text, this.backButton());
  }

  private async handleLanguage(ctx: Context) {
    const text =
      `🌐 <b>Tilni tanlang</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `Choose your language:\n\n` +
      `🇺🇿 O\'zbek tili\n` +
      `🇷🇺 Русский язык\n` +
      `🇬🇧 English`;

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('🇺🇿 O\'zbek', 'lang_uz'),
        Markup.button.callback('🇷🇺 Русский', 'lang_ru'),
        Markup.button.callback('🇬🇧 English', 'lang_en'),
      ],
      [Markup.button.callback('🏠 Bosh menyu', 'back_to_start')],
    ]);

    await this.replyOrEdit(ctx, text, keyboard);
  }

  private async handleSetLanguage(ctx: Context, lang: string) {
    try {
      const userId = await this.getOrCreateUserId(ctx);
      if (!userId) {
        await ctx.reply('❌ Foydalanuvchi topilmadi.');
        return;
      }

      await this.usersService.updateLanguage(userId, lang);

      const langName = lang === 'uz' ? 'O\'zbek' : lang === 'ru' ? 'Русский' : 'English';
      await ctx.answerCbQuery(`✅ Til o\'zgartirildi: ${langName}`);
      await this.sendHome(ctx);
    } catch (error) {
      this.logger.error(`Set language error: ${error.message}`);
      await ctx.answerCbQuery('❌ Xatolik yuz berdi');
    }
  }

  private async ensureUser(ctx: Context): Promise<any> {
    const telegramId = ctx.from?.id;
    if (!telegramId) return null;

    try {
      let user = await this.usersService.findByTelegramId(BigInt(telegramId));

      if (!user) {
        const defaultRole = await this.prisma.role.findUnique({
          where: { name: 'user' },
        });

        user = await this.usersService.create({
          telegramId: BigInt(telegramId),
          username: ctx.from?.username,
          firstName: ctx.from?.first_name,
          lastName: ctx.from?.last_name,
          roleId: defaultRole?.id || 'user',
        });
      } else {
        const updateData: Record<string, any> = {};
        if (ctx.from?.username && ctx.from.username !== user.username) {
          updateData.username = ctx.from.username;
        }
        if (ctx.from?.first_name && ctx.from.first_name !== user.firstName) {
          updateData.firstName = ctx.from.first_name;
        }
        if (ctx.from?.last_name !== user.lastName) {
          updateData.lastName = ctx.from.last_name || null;
        }
        if (Object.keys(updateData).length > 0) {
          await this.usersService.update(user.id, updateData);
        }
      }

      return user;
    } catch (error) {
      this.logger.error(`ensureUser error: ${error.message}`);
      return null;
    }
  }

  private async getOrCreateUserId(ctx: Context): Promise<string | null> {
    const user = await this.ensureUser(ctx);
    return user?.id || null;
  }

  private async replyOrEdit(
    ctx: Context,
    text: string,
    extra?: any,
    existingMessage?: any,
  ): Promise<any> {
    try {
      if (existingMessage?.message_id && ctx.chat) {
        try {
          return await ctx.telegram.editMessageText(
            ctx.chat.id,
            existingMessage.message_id,
            undefined,
            text,
            { parse_mode: 'HTML', ...extra },
          );
        } catch {
          return await ctx.reply(text, {
            parse_mode: 'HTML',
            ...extra,
          });
        }
      }
      return await ctx.reply(text, {
        parse_mode: 'HTML',
        ...extra,
      });
    } catch (error) {
      this.logger.warn(`replyOrEdit fallback: ${error.message}`);
      try {
        if (ctx.chat) {
          return await ctx.telegram.sendMessage(
            ctx.chat.id,
            text,
            { parse_mode: 'HTML', ...extra },
          );
        }
      } catch (fallbackError) {
        this.logger.error(`replyOrEdit fallback failed: ${fallbackError.message}`);
      }
      return null;
    }
  }

  private backButton() {
    return Markup.inlineKeyboard([
      [Markup.button.callback('🏠 Bosh menyu', 'back_to_start')],
    ]);
  }

  private createProgressBar(percent: number, length: number = 10): string {
    const filled = Math.round((percent / 100) * length);
    const empty = length - filled;
    return '█'.repeat(filled) + '░'.repeat(empty) + ` ${Math.round(percent)}%`;
  }

  private escapeHtml(text: string): string {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
