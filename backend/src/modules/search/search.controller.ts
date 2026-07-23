import {
  Controller,
  Get,
  Query,
  UseGuards,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { SearchService } from './search.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  SearchQueryDto,
  AutocompleteQueryDto,
  PopularSearchQueryDto,
  PersonSearchQueryDto,
} from './dto/search.dto';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({
    summary: 'Search movies and series',
    description:
      'Full-text search across movies and series by title, original title, description, tags, actor names, and director names.',
  })
  @ApiQuery({ name: 'q', required: true, type: String, description: 'Search query' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Sort by field',
    enum: ['relevance', 'rating', 'year', 'createdAt', 'viewCount'],
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    type: String,
    enum: ['asc', 'desc'],
  })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Search query is required' })
  async search(@Query() dto: SearchQueryDto) {
    return this.searchService.search(dto.q, dto);
  }

  @Get('autocomplete')
  @ApiOperation({
    summary: 'Autocomplete search',
    description:
      'Fast autocomplete suggestions from movie and series titles. Returns results starting with the query first.',
  })
  @ApiQuery({ name: 'q', required: true, type: String, description: 'Partial search query' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum suggestions (max 25)',
    example: 10,
  })
  @ApiResponse({ status: 200, description: 'Autocomplete suggestions retrieved successfully' })
  async autocomplete(
    @Query('q') query: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const safeLimit = Math.min(Math.max(limit, 1), 25);
    return this.searchService.autocomplete(query, safeLimit);
  }

  @Get('popular')
  @ApiOperation({
    summary: 'Get popular searches',
    description:
      'Returns the most searched terms from the last 30 days based on AISearchLog.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum popular searches (max 50)',
    example: 20,
  })
  @ApiResponse({ status: 200, description: 'Popular searches retrieved successfully' })
  async getPopularSearches(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    return this.searchService.getPopularSearches(safeLimit);
  }

  @Get('recent')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user recent searches',
    description:
      'Returns the authenticated user\'s recent unique search queries.',
  })
  @ApiResponse({ status: 200, description: 'Recent searches retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getRecentSearches(@CurrentUser('id') userId: string) {
    return this.searchService.getRecentSearches(userId);
  }

  @Get('actor')
  @ApiOperation({
    summary: 'Search by actor name',
    description:
      'Search for all movies and series featuring the specified actor.',
  })
  @ApiQuery({ name: 'q', required: true, type: String, description: 'Actor name' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'Actor search results retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Actor name is required' })
  async searchByActor(@Query() dto: PersonSearchQueryDto) {
    return this.searchService.searchByActor(dto.q, dto);
  }

  @Get('director')
  @ApiOperation({
    summary: 'Search by director name',
    description:
      'Search for all movies and series directed by the specified director.',
  })
  @ApiQuery({ name: 'q', required: true, type: String, description: 'Director name' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'Director search results retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Director name is required' })
  async searchByDirector(@Query() dto: PersonSearchQueryDto) {
    return this.searchService.searchByDirector(dto.q, dto);
  }
}
