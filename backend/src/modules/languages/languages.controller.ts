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
import { LanguagesService } from './languages.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreateLanguageDto, UpdateLanguageDto } from './dto/languages.dto';
import { Roles } from '../../common/guards/roles.guard';

@ApiTags('Languages')
@Controller('languages')
export class LanguagesController {
  constructor(private readonly languagesService: LanguagesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all languages' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Languages retrieved successfully' })
  async findAll(@Query() dto: PaginationDto) {
    return this.languagesService.findAll(dto);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Get language by code' })
  @ApiParam({ name: 'code', description: 'ISO 639-1 code' })
  @ApiResponse({ status: 200, description: 'Language found' })
  @ApiResponse({ status: 404, description: 'Language not found' })
  async findByCode(@Param('code') code: string) {
    return this.languagesService.findByCode(code);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get language by ID' })
  @ApiParam({ name: 'id', description: 'Language UUID' })
  @ApiResponse({ status: 200, description: 'Language found' })
  @ApiResponse({ status: 404, description: 'Language not found' })
  async findById(@Param('id') id: string) {
    return this.languagesService.findById(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create language (admin)' })
  @ApiResponse({ status: 201, description: 'Language created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 409, description: 'Conflict - name/code already exists' })
  async create(@Body() dto: CreateLanguageDto) {
    return this.languagesService.create(dto);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update language (admin)' })
  @ApiParam({ name: 'id', description: 'Language UUID' })
  @ApiResponse({ status: 200, description: 'Language updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 404, description: 'Language not found' })
  @ApiResponse({ status: 409, description: 'Conflict' })
  async update(@Param('id') id: string, @Body() dto: UpdateLanguageDto) {
    return this.languagesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete language (admin)' })
  @ApiParam({ name: 'id', description: 'Language UUID' })
  @ApiResponse({ status: 200, description: 'Language deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 404, description: 'Language not found' })
  async delete(@Param('id') id: string) {
    return this.languagesService.delete(id);
  }
}
