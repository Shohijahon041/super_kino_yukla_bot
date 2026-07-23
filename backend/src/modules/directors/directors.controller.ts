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
import { DirectorsService } from './directors.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreatePersonDto, UpdatePersonDto } from './dto/directors.dto';
import { Roles } from '../../common/guards/roles.guard';

@ApiTags('Directors')
@Controller('directors')
export class DirectorsController {
  constructor(private readonly directorsService: DirectorsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all directors' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Directors retrieved successfully' })
  async findAll(@Query() dto: PaginationDto) {
    return this.directorsService.findAll(dto);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search directors' })
  @ApiQuery({ name: 'q', required: true, type: String, description: 'Search query' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Search results retrieved' })
  @ApiResponse({ status: 400, description: 'Search query is required' })
  async search(
    @Query('q') query: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.directorsService.search(query, paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get director by ID' })
  @ApiParam({ name: 'id', description: 'Person UUID' })
  @ApiResponse({ status: 200, description: 'Director found' })
  @ApiResponse({ status: 404, description: 'Director not found' })
  async findById(@Param('id') id: string) {
    return this.directorsService.findById(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get director by slug' })
  @ApiParam({ name: 'slug', description: 'Person slug' })
  @ApiResponse({ status: 200, description: 'Director found' })
  @ApiResponse({ status: 404, description: 'Director not found' })
  async findBySlug(@Param('slug') slug: string) {
    return this.directorsService.findBySlug(slug);
  }

  @Get(':id/filmography')
  @ApiOperation({ summary: 'Get director filmography' })
  @ApiParam({ name: 'id', description: 'Person UUID' })
  @ApiResponse({ status: 200, description: 'Filmography retrieved' })
  @ApiResponse({ status: 404, description: 'Director not found' })
  async getFilmography(@Param('id') id: string) {
    return this.directorsService.getFilmography(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create director/person (admin)' })
  @ApiResponse({ status: 201, description: 'Director created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 409, description: 'Conflict - slug already exists' })
  async create(@Body() dto: CreatePersonDto) {
    return this.directorsService.create(dto);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update director/person (admin)' })
  @ApiParam({ name: 'id', description: 'Person UUID' })
  @ApiResponse({ status: 200, description: 'Director updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 404, description: 'Director not found' })
  @ApiResponse({ status: 409, description: 'Conflict' })
  async update(@Param('id') id: string, @Body() dto: UpdatePersonDto) {
    return this.directorsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete director/person (admin)' })
  @ApiParam({ name: 'id', description: 'Person UUID' })
  @ApiResponse({ status: 200, description: 'Director deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 404, description: 'Director not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete person with relations' })
  async delete(@Param('id') id: string) {
    return this.directorsService.delete(id);
  }
}
