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
  DefaultValuePipe,
  ParseIntPipe,
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
import { SeriesService } from './series.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  CreateSeriesDto,
  UpdateSeriesDto,
  FilterSeriesDto,
  CreateSeasonDto,
  CreateEpisodeDto,
  UpdateEpisodeDto,
} from './dto/series.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/guards/roles.guard';

@ApiTags('Series')
@Controller('series')
export class SeriesController {
  constructor(private readonly seriesService: SeriesService) {}

  @Get()
  @ApiOperation({
    summary: 'Get paginated series list',
    description: 'Returns a paginated list of active series with optional filters.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search query' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Sort field', enum: ['createdAt', 'year', 'rating', 'viewCount', 'title'] })
  @ApiQuery({ name: 'sortOrder', required: false, type: String, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'genre', required: false, type: String, description: 'Genre ID filter' })
  @ApiQuery({ name: 'year', required: false, type: Number, description: 'Year filter' })
  @ApiQuery({ name: 'country', required: false, type: String, description: 'Country ID filter' })
  @ApiQuery({ name: 'language', required: false, type: String, description: 'Language ID filter' })
  @ApiQuery({ name: 'status', required: false, type: String, enum: ['ongoing', 'completed', 'cancelled'] })
  @ApiQuery({ name: 'ageRating', required: false, type: String })
  @ApiQuery({ name: 'isFeatured', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Series retrieved successfully' })
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query() filterDto: FilterSeriesDto,
  ) {
    return this.seriesService.findAll(paginationDto, filterDto);
  }

  @Get('ongoing')
  @ApiOperation({
    summary: 'Get ongoing series',
    description: 'Returns all active series with status "ongoing".',
  })
  @ApiResponse({ status: 200, description: 'Ongoing series retrieved successfully' })
  async getOngoing() {
    return this.seriesService.getOngoing();
  }

  @Get('completed')
  @ApiOperation({
    summary: 'Get completed series',
    description: 'Returns all active series with status "completed".',
  })
  @ApiResponse({ status: 200, description: 'Completed series retrieved successfully' })
  async getCompleted() {
    return this.seriesService.getCompleted();
  }

  @Get('trending')
  @ApiOperation({
    summary: 'Get trending series',
    description: 'Returns the most viewed series from the last 7 days, with fallback to all-time most viewed.',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of results (max 50)', example: 20 })
  @ApiResponse({ status: 200, description: 'Trending series retrieved successfully' })
  async getTrending(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    return this.seriesService.getTrending(safeLimit);
  }

  @Get('new')
  @ApiOperation({
    summary: 'Get new releases',
    description: 'Returns the newest series sorted by creation date.',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of results (max 50)', example: 20 })
  @ApiResponse({ status: 200, description: 'New releases retrieved successfully' })
  async getNewReleases(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    return this.seriesService.getNewReleases(safeLimit);
  }

  @Get('top-rated')
  @ApiOperation({
    summary: 'Get top rated series',
    description: 'Returns the highest rated series that have at least one rating.',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of results (max 50)', example: 20 })
  @ApiResponse({ status: 200, description: 'Top rated series retrieved successfully' })
  async getTopRated(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    return this.seriesService.getTopRated(safeLimit);
  }

  @Get('random')
  @ApiOperation({
    summary: 'Get random series',
    description: 'Returns a single random active series with full details.',
  })
  @ApiResponse({ status: 200, description: 'Random series retrieved successfully' })
  @ApiResponse({ status: 404, description: 'No series available' })
  async getRandom() {
    return this.seriesService.getRandom();
  }

  @Get('search')
  @ApiOperation({
    summary: 'Search series',
    description: 'Search series by title, original title, or description.',
  })
  @ApiQuery({ name: 'q', required: true, type: String, description: 'Search query' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Search query is required' })
  async search(
    @Query('q') query: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.seriesService.search(query, paginationDto);
  }

  @Get('code/:code')
  @ApiOperation({
    summary: 'Get series by code',
    description: 'Find a series by its unique numeric code.',
  })
  @ApiParam({ name: 'code', description: 'Series numeric code', type: Number })
  @ApiResponse({ status: 200, description: 'Series found' })
  @ApiResponse({ status: 404, description: 'Series not found' })
  async findByCode(@Param('code', ParseIntPipe) code: number) {
    return this.seriesService.findByCode(code);
  }

  @Get('continue-watching')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get continue watching list',
    description: 'Returns the user\'s series in progress, grouped by series. Authentication required.',
  })
  @ApiResponse({ status: 200, description: 'Continue watching list retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getContinueWatching(@CurrentUser('id') userId: string) {
    return this.seriesService.getContinueWatching(userId);
  }

  @Get('episode/:episodeId')
  @ApiOperation({
    summary: 'Get episode details',
    description: 'Returns full episode details with season and series info.',
  })
  @ApiParam({ name: 'episodeId', description: 'Episode UUID' })
  @ApiResponse({ status: 200, description: 'Episode found' })
  @ApiResponse({ status: 404, description: 'Episode not found' })
  async getEpisode(@Param('episodeId') episodeId: string) {
    return this.seriesService.getEpisode(episodeId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get series details',
    description: 'Returns full series details including seasons, episodes, genres, countries, languages, actors, and directors.',
  })
  @ApiParam({ name: 'id', description: 'Series UUID' })
  @ApiResponse({ status: 200, description: 'Series details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Series not found' })
  async findOne(@Param('id') id: string) {
    return this.seriesService.findById(id);
  }

  @Get(':id/next-episode')
  @ApiOperation({
    summary: 'Get next episode',
    description: 'Returns the next episode in the series based on current season and episode numbers.',
  })
  @ApiParam({ name: 'id', description: 'Series UUID' })
  @ApiQuery({ name: 'season', required: true, type: Number, description: 'Current season number' })
  @ApiQuery({ name: 'episode', required: true, type: Number, description: 'Current episode number' })
  @ApiResponse({ status: 200, description: 'Next episode info retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Series or season not found' })
  async getNextEpisode(
    @Param('id') id: string,
    @Query('season', ParseIntPipe) season: number,
    @Query('episode', ParseIntPipe) episode: number,
  ) {
    return this.seriesService.getNextEpisode(id, season, episode);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a series (admin)',
    description: 'Create a new series with genres, countries, languages, actors, and directors. Requires admin role.',
  })
  @ApiResponse({ status: 201, description: 'Series created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  async create(@Body() dto: CreateSeriesDto) {
    return this.seriesService.create(dto);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update a series (admin)',
    description: 'Update series details and relations. Partial updates supported. Requires admin role.',
  })
  @ApiParam({ name: 'id', description: 'Series UUID' })
  @ApiResponse({ status: 200, description: 'Series updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 404, description: 'Series not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSeriesDto,
  ) {
    return this.seriesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a series (admin)',
    description: 'Soft-deletes a series by setting isActive to false. Requires admin role.',
  })
  @ApiParam({ name: 'id', description: 'Series UUID' })
  @ApiResponse({ status: 200, description: 'Series deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 404, description: 'Series not found' })
  async delete(@Param('id') id: string) {
    return this.seriesService.delete(id);
  }

  @Post(':id/season')
  @UseGuards(AuthGuard('jwt'))
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add a season (admin)',
    description: 'Add a new season to a series. Requires admin role.',
  })
  @ApiParam({ name: 'id', description: 'Series UUID' })
  @ApiResponse({ status: 201, description: 'Season created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or season already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 404, description: 'Series not found' })
  async addSeason(
    @Param('id') id: string,
    @Body() dto: CreateSeasonDto,
  ) {
    return this.seriesService.addSeason(id, dto);
  }

  @Post('season/:seasonId/episode')
  @UseGuards(AuthGuard('jwt'))
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add an episode (admin)',
    description: 'Add a new episode to a season. Requires admin role.',
  })
  @ApiParam({ name: 'seasonId', description: 'Season UUID' })
  @ApiResponse({ status: 201, description: 'Episode created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or episode already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 404, description: 'Season not found' })
  async addEpisode(
    @Param('seasonId') seasonId: string,
    @Body() dto: CreateEpisodeDto,
  ) {
    return this.seriesService.addEpisode(seasonId, dto);
  }

  @Put('episode/:episodeId')
  @UseGuards(AuthGuard('jwt'))
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update an episode (admin)',
    description: 'Update episode details. Partial updates supported. Requires admin role.',
  })
  @ApiParam({ name: 'episodeId', description: 'Episode UUID' })
  @ApiResponse({ status: 200, description: 'Episode updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 404, description: 'Episode not found' })
  async updateEpisode(
    @Param('episodeId') episodeId: string,
    @Body() dto: UpdateEpisodeDto,
  ) {
    return this.seriesService.updateEpisode(episodeId, dto);
  }

  @Post(':id/view')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Increment series view count',
    description: 'Increment the view count for a series. No authentication required.',
  })
  @ApiParam({ name: 'id', description: 'Series UUID' })
  @ApiResponse({ status: 200, description: 'View count incremented' })
  @ApiResponse({ status: 404, description: 'Series not found' })
  async incrementView(@Param('id') id: string) {
    return this.seriesService.incrementView(id);
  }
}
