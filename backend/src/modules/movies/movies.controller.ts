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
import { MoviesService } from './movies.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreateMovieDto, UpdateMovieDto, FilterMovieDto } from './dto/movies.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/guards/roles.guard';

@ApiTags('Movies')
@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get()
  @ApiOperation({
    summary: 'Get paginated movie list',
    description: 'Returns a paginated list of active movies with optional filters.',
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
  @ApiQuery({ name: 'quality', required: false, type: String, enum: ['4K', '1080p', '720p', '480p', 'CAM'] })
  @ApiQuery({ name: 'ageRating', required: false, type: String, enum: ['G', 'PG', 'PG-13', 'R', 'NC-17', '18+'] })
  @ApiQuery({ name: 'isFeatured', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Movies retrieved successfully' })
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query() filterDto: FilterMovieDto,
  ) {
    return this.moviesService.findAll(paginationDto, filterDto);
  }

  @Get('trending')
  @ApiOperation({
    summary: 'Get trending movies',
    description: 'Returns the most viewed movies from the last 7 days, with fallback to all-time most viewed.',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of results (max 50)', example: 20 })
  @ApiResponse({ status: 200, description: 'Trending movies retrieved successfully' })
  async getTrending(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    return this.moviesService.getTrending(safeLimit);
  }

  @Get('new')
  @ApiOperation({
    summary: 'Get new releases',
    description: 'Returns the newest movies sorted by creation date.',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of results (max 50)', example: 20 })
  @ApiResponse({ status: 200, description: 'New releases retrieved successfully' })
  async getNewReleases(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    return this.moviesService.getNewReleases(safeLimit);
  }

  @Get('top-rated')
  @ApiOperation({
    summary: 'Get top rated movies',
    description: 'Returns the highest rated movies that have at least one rating.',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of results (max 50)', example: 20 })
  @ApiResponse({ status: 200, description: 'Top rated movies retrieved successfully' })
  async getTopRated(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    return this.moviesService.getTopRated(safeLimit);
  }

  @Get('random')
  @ApiOperation({
    summary: 'Get random movie',
    description: 'Returns a single random active movie with full details.',
  })
  @ApiResponse({ status: 200, description: 'Random movie retrieved successfully' })
  @ApiResponse({ status: 404, description: 'No movies available' })
  async getRandom() {
    return this.moviesService.getRandom();
  }

  @Get('search')
  @ApiOperation({
    summary: 'Search movies',
    description: 'Search movies by title, original title, description, or tags.',
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
    return this.moviesService.search(query, paginationDto);
  }

  @Get('code/:code')
  @ApiOperation({
    summary: 'Get movie by code',
    description: 'Find a movie by its unique numeric code (Telegram bot format).',
  })
  @ApiParam({ name: 'code', description: 'Movie numeric code', type: Number })
  @ApiResponse({ status: 200, description: 'Movie found' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  async findByCode(@Param('code', ParseIntPipe) code: number) {
    return this.moviesService.findByCode(code);
  }

  @Get('slug/:slug')
  @ApiOperation({
    summary: 'Get movie by slug',
    description: 'Find a movie by its URL-friendly slug.',
  })
  @ApiParam({ name: 'slug', description: 'Movie slug', type: String })
  @ApiResponse({ status: 200, description: 'Movie found' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  async findBySlug(@Param('slug') slug: string) {
    return this.moviesService.findBySlug(slug);
  }

  @Get('genre/:genreId')
  @ApiOperation({
    summary: 'Get movies by genre',
    description: 'Returns paginated movies filtered by genre ID.',
  })
  @ApiParam({ name: 'genreId', description: 'Genre UUID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Movies by genre retrieved successfully' })
  async getByGenre(
    @Param('genreId') genreId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.moviesService.getByGenre(genreId, paginationDto);
  }

  @Get('year/:year')
  @ApiOperation({
    summary: 'Get movies by year',
    description: 'Returns paginated movies filtered by release year.',
  })
  @ApiParam({ name: 'year', description: 'Release year', type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Movies by year retrieved successfully' })
  async getByYear(
    @Param('year', ParseIntPipe) year: number,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.moviesService.getByYear(year, paginationDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get movie details',
    description: 'Returns full movie details including genres, countries, languages, actors, directors, screenshots, subtitles, and tags.',
  })
  @ApiParam({ name: 'id', description: 'Movie UUID' })
  @ApiResponse({ status: 200, description: 'Movie details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  async findOne(@Param('id') id: string) {
    return this.moviesService.findById(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a movie (admin)',
    description: 'Create a new movie with genres, countries, languages, actors, and directors. Requires admin role.',
  })
  @ApiResponse({ status: 201, description: 'Movie created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  async create(@Body() dto: CreateMovieDto) {
    return this.moviesService.create(dto);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update a movie (admin)',
    description: 'Update movie details and relations. Partial updates supported. Requires admin role.',
  })
  @ApiParam({ name: 'id', description: 'Movie UUID' })
  @ApiResponse({ status: 200, description: 'Movie updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateMovieDto,
  ) {
    return this.moviesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a movie (admin)',
    description: 'Soft-deletes a movie by setting isActive to false. Requires admin role.',
  })
  @ApiParam({ name: 'id', description: 'Movie UUID' })
  @ApiResponse({ status: 200, description: 'Movie deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  async delete(@Param('id') id: string) {
    return this.moviesService.delete(id);
  }

  @Post(':id/view')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Increment movie view count',
    description: 'Increment the view count for a movie. No authentication required.',
  })
  @ApiParam({ name: 'id', description: 'Movie UUID' })
  @ApiResponse({ status: 200, description: 'View count incremented' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  async incrementView(@Param('id') id: string) {
    return this.moviesService.incrementView(id);
  }

  @Post(':id/like')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Like a movie',
    description: 'Toggle like on a movie. Removes dislike if present. Authentication required.',
  })
  @ApiParam({ name: 'id', description: 'Movie UUID' })
  @ApiResponse({ status: 200, description: 'Like toggled successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  async likeMovie(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.moviesService.likeMovie(userId, id);
  }

  @Post(':id/dislike')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Dislike a movie',
    description: 'Toggle dislike on a movie. Removes like if present. Authentication required.',
  })
  @ApiParam({ name: 'id', description: 'Movie UUID' })
  @ApiResponse({ status: 200, description: 'Dislike toggled successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  async dislikeMovie(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.moviesService.dislikeMovie(userId, id);
  }
}
