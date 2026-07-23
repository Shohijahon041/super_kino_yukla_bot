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
import { ActorsService } from './actors.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreatePersonDto, UpdatePersonDto } from './dto/actors.dto';
import { Roles } from '../../common/guards/roles.guard';

@ApiTags('Actors')
@Controller('actors')
export class ActorsController {
  constructor(private readonly actorsService: ActorsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all actors' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Actors retrieved successfully' })
  async findAll(@Query() dto: PaginationDto) {
    return this.actorsService.findAll(dto);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search actors' })
  @ApiQuery({ name: 'q', required: true, type: String, description: 'Search query' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Search results retrieved' })
  @ApiResponse({ status: 400, description: 'Search query is required' })
  async search(
    @Query('q') query: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.actorsService.search(query, paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get actor by ID' })
  @ApiParam({ name: 'id', description: 'Person UUID' })
  @ApiResponse({ status: 200, description: 'Actor found' })
  @ApiResponse({ status: 404, description: 'Actor not found' })
  async findById(@Param('id') id: string) {
    return this.actorsService.findById(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get actor by slug' })
  @ApiParam({ name: 'slug', description: 'Person slug' })
  @ApiResponse({ status: 200, description: 'Actor found' })
  @ApiResponse({ status: 404, description: 'Actor not found' })
  async findBySlug(@Param('slug') slug: string) {
    return this.actorsService.findBySlug(slug);
  }

  @Get(':id/filmography')
  @ApiOperation({ summary: 'Get actor filmography' })
  @ApiParam({ name: 'id', description: 'Person UUID' })
  @ApiResponse({ status: 200, description: 'Filmography retrieved' })
  @ApiResponse({ status: 404, description: 'Actor not found' })
  async getFilmography(@Param('id') id: string) {
    return this.actorsService.getFilmography(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create actor/person (admin)' })
  @ApiResponse({ status: 201, description: 'Actor created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 409, description: 'Conflict - slug already exists' })
  async create(@Body() dto: CreatePersonDto) {
    return this.actorsService.create(dto);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update actor/person (admin)' })
  @ApiParam({ name: 'id', description: 'Person UUID' })
  @ApiResponse({ status: 200, description: 'Actor updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 404, description: 'Actor not found' })
  @ApiResponse({ status: 409, description: 'Conflict' })
  async update(@Param('id') id: string, @Body() dto: UpdatePersonDto) {
    return this.actorsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete actor/person (admin)' })
  @ApiParam({ name: 'id', description: 'Person UUID' })
  @ApiResponse({ status: 200, description: 'Actor deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 404, description: 'Actor not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete person with relations' })
  async delete(@Param('id') id: string) {
    return this.actorsService.delete(id);
  }
}
