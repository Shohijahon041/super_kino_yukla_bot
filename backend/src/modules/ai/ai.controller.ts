import {
  Controller,
  Get,
  Post,
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
import { AIService } from './ai.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  MoodSearchDto,
  NaturalSearchDto,
  IdentifyMovieDto,
  RecommendationQueryDto,
} from './dto/ai.dto';

@ApiTags('AI')
@Controller('ai')
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Get('recommendations')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get personalized recommendations',
    description:
      'Returns AI-powered personalized recommendations based on watch history, favorites, and genre preferences.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum recommendations (max 50)',
    example: 20,
  })
  @ApiResponse({ status: 200, description: 'Recommendations retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getRecommendations(
    @CurrentUser('id') userId: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    return this.aiService.getRecommendations(userId, safeLimit);
  }

  @Get('mood')
  @ApiOperation({
    summary: 'Get mood-based recommendations',
    description:
      'Returns content matching the specified mood. Supports Uzbek, Russian, and English mood keywords.',
  })
  @ApiQuery({
    name: 'q',
    required: true,
    type: String,
    description: 'Mood keyword (e.g., scary, funny, romantic)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum results (max 50)',
    example: 20,
  })
  @ApiResponse({ status: 200, description: 'Mood-based results retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid mood keyword' })
  async getMoodRecommendations(
    @Query('q') mood: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    return this.aiService.getMoodRecommendations(mood, safeLimit);
  }

  @Get('similar/:contentType/:id')
  @ApiOperation({
    summary: 'Get similar content',
    description:
      'Returns content similar to the specified movie or series based on genres, countries, and year proximity.',
  })
  @ApiParam({ name: 'contentType', description: 'Content type', enum: ['movie', 'series'] })
  @ApiParam({ name: 'id', description: 'Content UUID' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum results (max 50)',
    example: 20,
  })
  @ApiResponse({ status: 200, description: 'Similar content retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  async getSimilarContent(
    @Param('contentType') contentType: 'movie' | 'series',
    @Param('id') id: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    return this.aiService.getSimilarContent(id, contentType, safeLimit);
  }

  @Post('natural-search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Natural language search',
    description:
      'Parse and search using natural language queries. Supports Uzbek, Russian, and English. Example: "Comedy with Jackie Chan" or "2024 yilgi fantastika".',
  })
  @ApiResponse({ status: 200, description: 'Natural language search results retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid query' })
  async naturalLanguageSearch(@Body() dto: NaturalSearchDto) {
    return this.aiService.naturalLanguageSearch(dto.query, dto.userId);
  }

  @Post('identify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Identify movie from description',
    description:
      'Given a description of a movie (in Uzbek, Russian, or English), attempts to identify which movie it is.',
  })
  @ApiResponse({ status: 200, description: 'Movie identification results retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Could not extract keywords from description' })
  async identifyMovie(@Body() dto: IdentifyMovieDto) {
    return this.aiService.identifyMovie(dto.description);
  }

  @Get('spoiler-warning/:contentType/:id')
  @ApiOperation({
    summary: 'Get spoiler warning',
    description:
      'Returns a spoiler warning and safe summary for the specified content based on flagged reviews.',
  })
  @ApiParam({ name: 'contentType', description: 'Content type', enum: ['movie', 'series'] })
  @ApiParam({ name: 'id', description: 'Content UUID' })
  @ApiResponse({ status: 200, description: 'Spoiler warning generated successfully' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  async getSpoilerWarning(
    @Param('contentType') contentType: 'movie' | 'series',
    @Param('id') id: string,
  ) {
    return this.aiService.generateSpoilerWarning(id, contentType);
  }

  @Get('summary/:contentType/:id')
  @ApiOperation({
    summary: 'Get AI summary',
    description:
      'Generates a structured AI summary from the content description and non-spoiler reviews.',
  })
  @ApiParam({ name: 'contentType', description: 'Content type', enum: ['movie', 'series'] })
  @ApiParam({ name: 'id', description: 'Content UUID' })
  @ApiResponse({ status: 200, description: 'AI summary generated successfully' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  async getSummary(
    @Param('contentType') contentType: 'movie' | 'series',
    @Param('id') id: string,
  ) {
    return this.aiService.generateSummary(id, contentType);
  }

  @Get('trending-predictions')
  @ApiOperation({
    summary: 'Get trending predictions',
    description:
      'Predicts trending content based on view velocity (views in the last 24 hours vs the last 7 days).',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum results per type (max 50)',
    example: 20,
  })
  @ApiResponse({ status: 200, description: 'Trending predictions retrieved successfully' })
  async getTrendingPredictions(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    return this.aiService.getTrendingPredictions(safeLimit);
  }
}
