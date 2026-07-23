import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { BotController } from './bot.controller';
import { MoviesModule } from '../movies/movies.module';
import { SeriesModule } from '../series/series.module';
import { UsersModule } from '../users/users.module';
import { SearchModule } from '../search/search.module';
import { FavoritesModule } from '../favorites/favorites.module';
import { HistoryModule } from '../history/history.module';
import { GamificationModule } from '../gamification/gamification.module';
import { PrismaModule } from '../../config/prisma.module';

@Module({
  imports: [
    PrismaModule,
    MoviesModule,
    SeriesModule,
    UsersModule,
    SearchModule,
    FavoritesModule,
    HistoryModule,
    GamificationModule,
  ],
  controllers: [BotController],
  providers: [BotService],
  exports: [BotService],
})
export class BotModule {}
