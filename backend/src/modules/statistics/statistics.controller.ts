import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { StatisticsService } from './statistics.service';
import { TrackViewDto, DailyStatsQueryDto } from './dto/statistics.dto';

@ApiTags('Statistics')
@Controller('stats')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('global')
  @ApiOperation({
    summary: 'Get global statistics',
    description:
      'Returns comprehensive global statistics including user counts, content counts, views, and top genres.',
  })
  @ApiResponse({ status: 200, description: 'Global statistics retrieved successfully' })
  async getGlobalStats() {
    return this.statisticsService.getGlobalStats();
  }

  @Get('movie/:id')
  @ApiOperation({
    summary: 'Get movie statistics',
    description: 'Returns detailed statistics for a specific movie including views, ratings, and daily view chart.',
  })
  @ApiParam({ name: 'id', description: 'Movie UUID' })
  @ApiResponse({ status: 200, description: 'Movie statistics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  async getMovieStats(@Param('id') id: string) {
    return this.statisticsService.getMovieStats(id);
  }

  @Get('user/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user statistics',
    description: 'Returns detailed statistics for a specific user including watch time, favorites, and recent activity.',
  })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User statistics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserStats(@Param('id') id: string) {
    return this.statisticsService.getUserStats(id);
  }

  @Get('daily')
  @ApiOperation({
    summary: 'Get daily statistics',
    description: 'Returns daily aggregated statistics with configurable date range and summary.',
  })
  @ApiResponse({ status: 200, description: 'Daily statistics retrieved successfully' })
  async getDailyStats(@Query() query: DailyStatsQueryDto) {
    return this.statisticsService.getDailyStats(query.startDate, query.endDate);
  }

  @Get('countries')
  @ApiOperation({
    summary: 'Get country statistics',
    description: 'Returns content statistics aggregated by country.',
  })
  @ApiResponse({ status: 200, description: 'Country statistics retrieved successfully' })
  async getCountryStats() {
    return this.statisticsService.getCountryStats();
  }

  @Get('devices')
  @ApiOperation({
    summary: 'Get device statistics',
    description: 'Returns session statistics broken down by platform and device type.',
  })
  @ApiResponse({ status: 200, description: 'Device statistics retrieved successfully' })
  async getDeviceStats() {
    return this.statisticsService.getDeviceStats();
  }

  @Post('track')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Track a view event',
    description:
      'Records a view event for a movie or series. Increments view counters and updates daily statistics.',
  })
  @ApiResponse({ status: 201, description: 'View tracked successfully' })
  @ApiResponse({ status: 404, description: 'Entity not found' })
  async trackView(@Body() dto: TrackViewDto) {
    return this.statisticsService.trackView(dto);
  }
}
