import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
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
  ApiParam,
} from '@nestjs/swagger';
import { HistoryService } from './history.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

class UpdateProgressDto {
  movieId?: string;
  episodeId?: string;
  progress: number;
  duration: number;
}

@ApiTags('Watch History')
@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Post('progress')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update watch progress' })
  @ApiResponse({ status: 200, description: 'Progress updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProgress(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProgressDto,
  ) {
    return this.historyService.updateProgress(userId, dto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get watch history' })
  @ApiResponse({ status: 200, description: 'History retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getWatchHistory(
    @CurrentUser('id') userId: string,
    @Query() dto: PaginationDto,
  ) {
    return this.historyService.getWatchHistory(userId, dto);
  }

  @Get('continue')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get continue watching' })
  @ApiResponse({ status: 200, description: 'Continue watching list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getContinueWatching(@CurrentUser('id') userId: string) {
    return this.historyService.getContinueWatching(userId);
  }

  @Get('stats')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get watch statistics' })
  @ApiResponse({ status: 200, description: 'Stats retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getWatchStats(@CurrentUser('id') userId: string) {
    return this.historyService.getWatchStats(userId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove from history' })
  @ApiParam({ name: 'id', description: 'History entry UUID' })
  @ApiResponse({ status: 200, description: 'Entry removed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Entry not found' })
  async removeFromHistory(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.historyService.removeFromHistory(userId, id);
  }

  @Delete()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear all history' })
  @ApiResponse({ status: 200, description: 'History cleared' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async clearHistory(@CurrentUser('id') userId: string) {
    return this.historyService.clearHistory(userId);
  }
}
