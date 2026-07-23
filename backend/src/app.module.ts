import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './config/prisma.module';
import { RedisModule } from './config/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { MoviesModule } from './modules/movies/movies.module';
import { SeriesModule } from './modules/series/series.module';
import { GenresModule } from './modules/genres/genres.module';
import { CountriesModule } from './modules/countries/countries.module';
import { LanguagesModule } from './modules/languages/languages.module';
import { ActorsModule } from './modules/actors/actors.module';
import { DirectorsModule } from './modules/directors/directors.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { CollectionsModule } from './modules/collections/collections.module';
import { SearchModule } from './modules/search/search.module';
import { AIModule } from './modules/ai/ai.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { HistoryModule } from './modules/history/history.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ReferralsModule } from './modules/referrals/referrals.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminModule } from './modules/admin/admin.module';
import { ReportsModule } from './modules/reports/reports.module';
import { MediaModule } from './modules/media/media.module';
import { QueueModule } from './modules/queue/queue.module';
import { CacheModule } from './modules/cache/cache.module';
import { BotModule } from './modules/bot/bot.module';
import { HealthModule } from './modules/health/health.module';
import { StatisticsModule } from './modules/statistics/statistics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    MoviesModule,
    SeriesModule,
    GenresModule,
    CountriesModule,
    LanguagesModule,
    ActorsModule,
    DirectorsModule,
    CategoriesModule,
    CollectionsModule,
    SearchModule,
    AIModule,
    FavoritesModule,
    HistoryModule,
    SubscriptionsModule,
    PaymentsModule,
    ReferralsModule,
    NotificationsModule,
    AdminModule,
    ReportsModule,
    MediaModule,
    QueueModule,
    CacheModule,
    BotModule,
    HealthModule,
    StatisticsModule,
  ],
})
export class AppModule {}
