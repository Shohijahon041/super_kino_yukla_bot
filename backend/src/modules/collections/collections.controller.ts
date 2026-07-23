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
} from '@nestjs/swagger';
import { CollectionsService } from './collections.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  CreateCollectionDto,
  UpdateCollectionDto,
  AddCollectionItemDto,
  ReorderItemsDto,
} from './dto/collections.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Collections')
@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create collection' })
  @ApiResponse({ status: 201, description: 'Collection created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createCollection(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCollectionDto,
  ) {
    return this.collectionsService.createCollection(userId, dto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user collections' })
  @ApiResponse({ status: 200, description: 'Collections retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserCollections(@CurrentUser('id') userId: string) {
    return this.collectionsService.getUserCollections(userId);
  }

  @Get('public')
  @ApiOperation({ summary: 'Get public collections' })
  @ApiResponse({ status: 200, description: 'Public collections retrieved' })
  async getPublicCollections(@Query() dto: PaginationDto) {
    return this.collectionsService.getPublicCollections(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get collection by ID' })
  @ApiParam({ name: 'id', description: 'Collection UUID' })
  @ApiResponse({ status: 200, description: 'Collection retrieved' })
  @ApiResponse({ status: 404, description: 'Collection not found' })
  async getCollectionById(@Param('id') id: string) {
    return this.collectionsService.getCollectionById(id);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update collection' })
  @ApiParam({ name: 'id', description: 'Collection UUID' })
  @ApiResponse({ status: 200, description: 'Collection updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Collection not found' })
  async updateCollection(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCollectionDto,
  ) {
    return this.collectionsService.updateCollection(userId, id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete collection' })
  @ApiParam({ name: 'id', description: 'Collection UUID' })
  @ApiResponse({ status: 200, description: 'Collection deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Collection not found' })
  async deleteCollection(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.collectionsService.deleteCollection(userId, id);
  }

  @Post(':id/items')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add item to collection' })
  @ApiParam({ name: 'id', description: 'Collection UUID' })
  @ApiResponse({ status: 201, description: 'Item added' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async addItem(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: AddCollectionItemDto,
  ) {
    return this.collectionsService.addItem(userId, id, dto);
  }

  @Delete(':id/items/:itemId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove item from collection' })
  @ApiParam({ name: 'id', description: 'Collection UUID' })
  @ApiParam({ name: 'itemId', description: 'Item UUID' })
  @ApiResponse({ status: 200, description: 'Item removed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async removeItem(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ) {
    return this.collectionsService.removeItem(userId, id, itemId);
  }

  @Put(':id/reorder')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reorder collection items' })
  @ApiParam({ name: 'id', description: 'Collection UUID' })
  @ApiResponse({ status: 200, description: 'Items reordered' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async reorderItems(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: ReorderItemsDto,
  ) {
    return this.collectionsService.reorderItems(userId, id, dto);
  }
}
