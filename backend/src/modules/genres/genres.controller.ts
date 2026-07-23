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
import { GenresService } from './genres.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreateGenreDto, UpdateGenreDto } from './dto/genres.dto';
import { Roles } from '../../common/guards/roles.guard';

@ApiTags('Genres')
@Controller('genres')
export class GenresController {
  constructor(private readonly genresService: GenresService) {}

  @Get()
  @ApiOperation({ summary: 'Get all genres' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Genres retrieved successfully' })
  async findAll(@Query() dto: PaginationDto) {
    return this.genresService.findAll(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get genre by ID' })
  @ApiParam({ name: 'id', description: 'Genre UUID' })
  @ApiResponse({ status: 200, description: 'Genre found' })
  @ApiResponse({ status: 404, description: 'Genre not found' })
  async findById(@Param('id') id: string) {
    return this.genresService.findById(id);
  }

  @Get('name/:name')
  @ApiOperation({ summary: 'Get genre by name' })
  @ApiParam({ name: 'name', description: 'Genre name' })
  @ApiResponse({ status: 200, description: 'Genre found' })
  @ApiResponse({ status: 404, description: 'Genre not found' })
  async findByName(@Param('name') name: string) {
    return this.genresService.findByName(name);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get genre by slug' })
  @ApiParam({ name: 'slug', description: 'Genre slug' })
  @ApiResponse({ status: 200, description: 'Genre found' })
  @ApiResponse({ status: 404, description: 'Genre not found' })
  async findBySlug(@Param('slug') slug: string) {
    return this.genresService.findBySlug(slug);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create genre (admin)' })
  @ApiResponse({ status: 201, description: 'Genre created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 409, description: 'Conflict - name/slug already exists' })
  async create(@Body() dto: CreateGenreDto) {
    return this.genresService.create(dto);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update genre (admin)' })
  @ApiParam({ name: 'id', description: 'Genre UUID' })
  @ApiResponse({ status: 200, description: 'Genre updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 404, description: 'Genre not found' })
  @ApiResponse({ status: 409, description: 'Conflict' })
  async update(@Param('id') id: string, @Body() dto: UpdateGenreDto) {
    return this.genresService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete genre (admin)' })
  @ApiParam({ name: 'id', description: 'Genre UUID' })
  @ApiResponse({ status: 200, description: 'Genre deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 404, description: 'Genre not found' })
  async delete(@Param('id') id: string) {
    return this.genresService.delete(id);
  }
}
