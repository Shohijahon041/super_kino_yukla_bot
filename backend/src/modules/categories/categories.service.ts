import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service';
import { PaginationDto, PaginatedResponse } from '../../common/dto/pagination.dto';
import { CreateCategoryDto, UpdateCategoryDto, ReorderCategoriesDto } from './dto/categories.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(dto: PaginationDto): Promise<PaginatedResponse<any>> {
    const where: Prisma.ContentCategoryWhereInput = {};

    if (dto.search) {
      where.OR = [
        { name: { contains: dto.search, mode: 'insensitive' } },
        { description: { contains: dto.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.ContentCategoryOrderByWithRelationInput = {};
    if (dto.sortBy && dto.sortBy in ['name', 'order', 'createdAt', 'id']) {
      orderBy[dto.sortBy as 'name'] = dto.sortOrder;
    } else {
      orderBy.order = 'asc';
    }

    const [data, total] = await Promise.all([
      this.prisma.contentCategory.findMany({
        where,
        skip: dto.skip,
        take: dto.limit,
        orderBy,
      }),
      this.prisma.contentCategory.count({ where }),
    ]);

    return new PaginatedResponse(data, total, dto.page, dto.limit);
  }

  async findById(id: string) {
    const category = await this.prisma.contentCategory.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async create(dto: CreateCategoryDto) {
    const slug = dto.slug || this.generateSlug(dto.name);

    const existing = await this.prisma.contentCategory.findFirst({
      where: { OR: [{ name: dto.name }, { slug }] },
    });

    if (existing) {
      throw new ConflictException(
        existing.name === dto.name
          ? 'Category with this name already exists'
          : 'Category with this slug already exists',
      );
    }

    if (dto.order === undefined) {
      const maxOrder = await this.prisma.contentCategory.findFirst({
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      dto.order = (maxOrder?.order ?? -1) + 1;
    }

    return this.prisma.contentCategory.create({
      data: {
        name: dto.name,
        slug,
        icon: dto.icon,
        description: dto.description,
        order: dto.order,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findById(id);

    const updateData: Prisma.ContentCategoryUpdateInput = {};

    if (dto.name !== undefined) {
      const existing = await this.prisma.contentCategory.findFirst({
        where: { name: dto.name, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException('Category with this name already exists');
      }
      updateData.name = dto.name;
    }

    if (dto.slug !== undefined) {
      const existing = await this.prisma.contentCategory.findFirst({
        where: { slug: dto.slug, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException('Category with this slug already exists');
      }
      updateData.slug = dto.slug;
    }

    if (dto.icon !== undefined) updateData.icon = dto.icon;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.order !== undefined) updateData.order = dto.order;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    return this.prisma.contentCategory.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string) {
    await this.findById(id);

    await this.prisma.contentCategory.delete({ where: { id } });
    return { deleted: true };
  }

  async reorder(dto: ReorderCategoriesDto) {
    const categories = await this.prisma.contentCategory.findMany();
    const categoryIds = new Set(categories.map((c) => c.id));

    for (const categoryId of dto.categoryIds) {
      if (!categoryIds.has(categoryId)) {
        throw new BadRequestException(`Category ${categoryId} does not exist`);
      }
    }

    const updatePromises = dto.categoryIds.map((categoryId, index) =>
      this.prisma.contentCategory.update({
        where: { id: categoryId },
        data: { order: index },
      }),
    );

    await this.prisma.$transaction(updatePromises);

    return this.prisma.contentCategory.findMany({
      orderBy: { order: 'asc' },
    });
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
