import {
  Controller,
  Get,
  Post,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CacheService } from './cache.service';

@ApiTags('Cache')
@Controller('cache')
export class CacheController {
  constructor(private readonly cacheService: CacheService) {}

  @Get('stats')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get cache statistics',
    description:
      'Returns cache statistics including key counts, memory usage, hit/miss rates, and breakdown by prefix.',
  })
  @ApiResponse({ status: 200, description: 'Cache statistics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCacheStats() {
    return this.cacheService.getCacheStats();
  }

  @Post('warm-up')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Warm up cache',
    description:
      'Preloads trending, new releases, and top rated content into cache. Returns the number of cached keys and duration.',
  })
  @ApiResponse({ status: 200, description: 'Cache warmed up successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async warmUp() {
    return this.cacheService.warmUp();
  }

  @Delete('flush')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Flush all cached data',
    description: 'Removes all application cache keys from Redis. Does not affect other keys.',
  })
  @ApiResponse({ status: 200, description: 'Cache flushed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async flushAll() {
    return this.cacheService.flushAll();
  }
}
