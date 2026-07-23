import {
  Controller,
  Get,
  Post,
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
import { FavoritesService } from './favorites.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Favorites')
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post('movie/:movieId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle movie favorite' })
  @ApiParam({ name: 'movieId', description: 'Movie UUID' })
  @ApiResponse({ status: 200, description: 'Favorite toggled' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  async toggleFavorite(
    @CurrentUser('id') userId: string,
    @Param('movieId') movieId: string,
  ) {
    return this.favoritesService.toggleFavorite(userId, movieId);
  }

  @Post('series/:seriesId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle series favorite' })
  @ApiParam({ name: 'seriesId', description: 'Series UUID' })
  @ApiResponse({ status: 200, description: 'Favorite toggled' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Series not found' })
  async toggleSeriesFavorite(
    @CurrentUser('id') userId: string,
    @Param('seriesId') seriesId: string,
  ) {
    return this.favoritesService.toggleSeriesFavorite(userId, seriesId);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user favorites' })
  @ApiResponse({ status: 200, description: 'Favorites retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserFavorites(
    @CurrentUser('id') userId: string,
    @Query() dto: PaginationDto,
  ) {
    return this.favoritesService.getUserFavorites(userId, dto);
  }

  @Get('check/:movieId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if movie is favorited' })
  @ApiParam({ name: 'movieId', description: 'Movie UUID' })
  @ApiResponse({ status: 200, description: 'Check result' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async isFavorited(
    @CurrentUser('id') userId: string,
    @Param('movieId') movieId: string,
  ) {
    const favorited = await this.favoritesService.isFavorited(userId, movieId);
    return { favorited };
  }

  @Get('count')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get favorites count' })
  @ApiResponse({ status: 200, description: 'Count retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getFavoritesCount(@CurrentUser('id') userId: string) {
    const count = await this.favoritesService.getFavoritesCount(userId);
    return { count };
  }
}
