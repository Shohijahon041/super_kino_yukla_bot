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
import { CountriesService } from './countries.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreateCountryDto, UpdateCountryDto } from './dto/countries.dto';
import { Roles } from '../../common/guards/roles.guard';

@ApiTags('Countries')
@Controller('countries')
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all countries' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Countries retrieved successfully' })
  async findAll(@Query() dto: PaginationDto) {
    return this.countriesService.findAll(dto);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Get country by code' })
  @ApiParam({ name: 'code', description: 'ISO 3166-1 alpha-2 code' })
  @ApiResponse({ status: 200, description: 'Country found' })
  @ApiResponse({ status: 404, description: 'Country not found' })
  async findByCode(@Param('code') code: string) {
    return this.countriesService.findByCode(code);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get country by ID' })
  @ApiParam({ name: 'id', description: 'Country UUID' })
  @ApiResponse({ status: 200, description: 'Country found' })
  @ApiResponse({ status: 404, description: 'Country not found' })
  async findById(@Param('id') id: string) {
    return this.countriesService.findById(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create country (admin)' })
  @ApiResponse({ status: 201, description: 'Country created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 409, description: 'Conflict - name/code already exists' })
  async create(@Body() dto: CreateCountryDto) {
    return this.countriesService.create(dto);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update country (admin)' })
  @ApiParam({ name: 'id', description: 'Country UUID' })
  @ApiResponse({ status: 200, description: 'Country updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 404, description: 'Country not found' })
  @ApiResponse({ status: 409, description: 'Conflict' })
  async update(@Param('id') id: string, @Body() dto: UpdateCountryDto) {
    return this.countriesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete country (admin)' })
  @ApiParam({ name: 'id', description: 'Country UUID' })
  @ApiResponse({ status: 200, description: 'Country deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 404, description: 'Country not found' })
  async delete(@Param('id') id: string) {
    return this.countriesService.delete(id);
  }
}
