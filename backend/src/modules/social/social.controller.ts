import {
  Controller,
  Get,
  Post,
  Put,
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
  ApiQuery,
} from '@nestjs/swagger';
import { SocialService } from './social.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  CreateReviewDto,
  UpdateReviewDto,
  AddReactionDto,
  ReportReviewDto,
} from './dto/social.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Social (Reviews & Reactions)')
@Controller()
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Post('reviews/movie/:movieId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create movie review' })
  @ApiParam({ name: 'movieId', description: 'Movie UUID' })
  @ApiResponse({ status: 201, description: 'Review created' })
  @ApiResponse({ status: 400, description: 'Already reviewed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  async createMovieReview(
    @CurrentUser('id') userId: string,
    @Param('movieId') movieId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.socialService.createReview(userId, dto, movieId);
  }

  @Post('reviews/series/:seriesId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create series review' })
  @ApiParam({ name: 'seriesId', description: 'Series UUID' })
  @ApiResponse({ status: 201, description: 'Review created' })
  @ApiResponse({ status: 400, description: 'Already reviewed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Series not found' })
  async createSeriesReview(
    @CurrentUser('id') userId: string,
    @Param('seriesId') seriesId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.socialService.createReview(userId, dto, undefined, seriesId);
  }

  @Put('reviews/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update review' })
  @ApiParam({ name: 'id', description: 'Review UUID' })
  @ApiResponse({ status: 200, description: 'Review updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not your review' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async updateReview(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.socialService.updateReview(userId, id, dto);
  }

  @Delete('reviews/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete review' })
  @ApiParam({ name: 'id', description: 'Review UUID' })
  @ApiResponse({ status: 200, description: 'Review deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not your review' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async deleteReview(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.socialService.deleteReview(userId, id);
  }

  @Get('reviews/movie/:movieId')
  @ApiOperation({ summary: 'Get movie reviews' })
  @ApiParam({ name: 'movieId', description: 'Movie UUID' })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['recent', 'popular', 'rating'] })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Reviews retrieved' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  async getMovieReviews(
    @Param('movieId') movieId: string,
    @Query() paginationDto: PaginationDto,
    @Query('sortBy') sortBy?: 'recent' | 'popular' | 'rating',
  ) {
    return this.socialService.getMovieReviews(movieId, paginationDto, sortBy);
  }

  @Get('reviews/series/:seriesId')
  @ApiOperation({ summary: 'Get series reviews' })
  @ApiParam({ name: 'seriesId', description: 'Series UUID' })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['recent', 'popular', 'rating'] })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Reviews retrieved' })
  @ApiResponse({ status: 404, description: 'Series not found' })
  async getSeriesReviews(
    @Param('seriesId') seriesId: string,
    @Query() paginationDto: PaginationDto,
    @Query('sortBy') sortBy?: 'recent' | 'popular' | 'rating',
  ) {
    return this.socialService.getSeriesReviews(seriesId, paginationDto, sortBy);
  }

  @Post('reviews/:id/like')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Like/unlike review' })
  @ApiParam({ name: 'id', description: 'Review UUID' })
  @ApiResponse({ status: 200, description: 'Like toggled' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async toggleLikeReview(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.socialService.toggleLikeReview(userId, id);
  }

  @Post('reactions/:contentType/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add/update reaction' })
  @ApiParam({ name: 'contentType', enum: ['movie', 'series'] })
  @ApiParam({ name: 'id', description: 'Content UUID' })
  @ApiResponse({ status: 200, description: 'Reaction toggled' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  async addReaction(
    @CurrentUser('id') userId: string,
    @Param('contentType') contentType: 'movie' | 'series',
    @Param('id') id: string,
    @Body() dto: AddReactionDto,
  ) {
    return this.socialService.addReaction(userId, dto, contentType, id);
  }

  @Get('reactions/:contentType/:id')
  @ApiOperation({ summary: 'Get reactions' })
  @ApiParam({ name: 'contentType', enum: ['movie', 'series'] })
  @ApiParam({ name: 'id', description: 'Content UUID' })
  @ApiResponse({ status: 200, description: 'Reactions retrieved' })
  async getReactions(
    @Param('contentType') contentType: 'movie' | 'series',
    @Param('id') id: string,
  ) {
    return this.socialService.getReactions(contentType, id);
  }

  @Post('reviews/:id/report')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Report a review' })
  @ApiParam({ name: 'id', description: 'Review UUID' })
  @ApiResponse({ status: 201, description: 'Report submitted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Cannot report own review' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async reportReview(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: ReportReviewDto,
  ) {
    return this.socialService.reportReview(userId, id, dto);
  }
}
