import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service';
import { PaginationDto, PaginatedResponse } from '../../common/dto/pagination.dto';
import {
  CreateCollectionDto,
  UpdateCollectionDto,
  AddCollectionItemDto,
  ReorderItemsDto,
} from './dto/collections.dto';

@Injectable()
export class CollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async createCollection(userId: string, dto: CreateCollectionDto) {
    return this.prisma.collection.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description,
        isPublic: dto.isPublic ?? false,
        poster: dto.poster,
      },
      include: {
        items: true,
      },
    });
  }

  async updateCollection(userId: string, collectionId: string, dto: UpdateCollectionDto) {
    const collection = await this.prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    if (collection.userId !== userId) {
      throw new ForbiddenException('Not your collection');
    }

    const updateData: Prisma.CollectionUpdateInput = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.isPublic !== undefined) updateData.isPublic = dto.isPublic;
    if (dto.poster !== undefined) updateData.poster = dto.poster;

    return this.prisma.collection.update({
      where: { id: collectionId },
      data: updateData,
      include: { items: true },
    });
  }

  async deleteCollection(userId: string, collectionId: string) {
    const collection = await this.prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    if (collection.userId !== userId) {
      throw new ForbiddenException('Not your collection');
    }

    await this.prisma.collection.delete({ where: { id: collectionId } });
    return { deleted: true };
  }

  async getUserCollections(userId: string) {
    return this.prisma.collection.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { items: true } },
      },
    });
  }

  async getPublicCollections(dto: PaginationDto): Promise<PaginatedResponse<any>> {
    const where: Prisma.CollectionWhereInput = { isPublic: true };

    if (dto.search) {
      where.OR = [
        { name: { contains: dto.search, mode: 'insensitive' } },
        { description: { contains: dto.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.collection.findMany({
        where,
        skip: dto.skip,
        take: dto.limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              avatar: true,
            },
          },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.collection.count({ where }),
    ]);

    return new PaginatedResponse(data, total, dto.page, dto.limit);
  }

  async getCollectionById(id: string) {
    const collection = await this.prisma.collection.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            avatar: true,
          },
        },
        items: {
          orderBy: { order: 'asc' },
          include: {
            movie: {
              select: {
                id: true,
                title: true,
                slug: true,
                poster: true,
                backdrop: true,
                year: true,
                duration: true,
                rating: true,
                quality: true,
              },
            },
            series: {
              select: {
                id: true,
                title: true,
                slug: true,
                poster: true,
                backdrop: true,
                year: true,
                rating: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    return collection;
  }

  async addItem(userId: string, collectionId: string, dto: AddCollectionItemDto) {
    const collection = await this.prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    if (collection.userId !== userId) {
      throw new ForbiddenException('Not your collection');
    }

    if (!dto.movieId && !dto.seriesId) {
      throw new BadRequestException('Either movieId or seriesId is required');
    }

    if (dto.movieId) {
      const movie = await this.prisma.movie.findUnique({ where: { id: dto.movieId } });
      if (!movie) throw new NotFoundException('Movie not found');

      const existingItem = await this.prisma.collectionItem.findUnique({
        where: { collectionId_movieId: { collectionId, movieId: dto.movieId } },
      });
      if (existingItem) {
        throw new BadRequestException('Movie already in collection');
      }
    }

    if (dto.seriesId) {
      const series = await this.prisma.series.findUnique({ where: { id: dto.seriesId } });
      if (!series) throw new NotFoundException('Series not found');

      const existingItem = await this.prisma.collectionItem.findUnique({
        where: { collectionId_seriesId: { collectionId, seriesId: dto.seriesId } },
      });
      if (existingItem) {
        throw new BadRequestException('Series already in collection');
      }
    }

    const maxOrderItem = await this.prisma.collectionItem.findFirst({
      where: { collectionId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const nextOrder = (maxOrderItem?.order ?? -1) + 1;

    return this.prisma.collectionItem.create({
      data: {
        collectionId,
        movieId: dto.movieId,
        seriesId: dto.seriesId,
        order: nextOrder,
      },
      include: {
        movie: {
          select: { id: true, title: true, slug: true, poster: true },
        },
        series: {
          select: { id: true, title: true, slug: true, poster: true },
        },
      },
    });
  }

  async removeItem(userId: string, collectionId: string, itemId: string) {
    const collection = await this.prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    if (collection.userId !== userId) {
      throw new ForbiddenException('Not your collection');
    }

    const item = await this.prisma.collectionItem.findUnique({
      where: { id: itemId },
    });

    if (!item || item.collectionId !== collectionId) {
      throw new NotFoundException('Item not found in this collection');
    }

    await this.prisma.collectionItem.delete({ where: { id: itemId } });
    return { deleted: true };
  }

  async reorderItems(userId: string, collectionId: string, dto: ReorderItemsDto) {
    const collection = await this.prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    if (collection.userId !== userId) {
      throw new ForbiddenException('Not your collection');
    }

    const items = await this.prisma.collectionItem.findMany({
      where: { collectionId },
    });

    const itemIds = new Set(items.map((i) => i.id));
    for (const itemId of dto.itemIds) {
      if (!itemIds.has(itemId)) {
        throw new BadRequestException(`Item ${itemId} does not belong to this collection`);
      }
    }

    const updatePromises = dto.itemIds.map((itemId, index) =>
      this.prisma.collectionItem.update({
        where: { id: itemId },
        data: { order: index },
      }),
    );

    await this.prisma.$transaction(updatePromises);

    return this.prisma.collectionItem.findMany({
      where: { collectionId },
      orderBy: { order: 'asc' },
      include: {
        movie: {
          select: { id: true, title: true, slug: true, poster: true },
        },
        series: {
          select: { id: true, title: true, slug: true, poster: true },
        },
      },
    });
  }
}
