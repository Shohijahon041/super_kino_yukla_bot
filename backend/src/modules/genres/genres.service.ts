import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service';
import { PaginationDto, PaginatedResponse } from '../../common/dto/pagination.dto';
import { CreateGenreDto, UpdateGenreDto } from './dto/genres.dto';

@Injectable()
export class GenresService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(dto: PaginationDto): Promise<PaginatedResponse<any>> {
    const where: Prisma.GenreWhereInput = {};

    if (dto.search) {
      where.OR = [
        { name: { contains: dto.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.GenreOrderByWithRelationInput = {};
    if (dto.sortBy && dto.sortBy in ['name', 'slug', 'id']) {
      orderBy[dto.sortBy as 'name' | 'slug'] = dto.sortOrder;
    } else {
      orderBy.name = 'asc';
    }

    const [data, total] = await Promise.all([
      this.prisma.genre.findMany({
        where,
        skip: dto.skip,
        take: dto.limit,
        orderBy,
        include: {
          _count: {
            select: { movies: true, series: true },
          },
        },
      }),
      this.prisma.genre.count({ where }),
    ]);

    return new PaginatedResponse(data, total, dto.page, dto.limit);
  }

  async findById(id: string) {
    const genre = await this.prisma.genre.findUnique({
      where: { id },
      include: {
        _count: {
          select: { movies: true, series: true },
        },
      },
    });

    if (!genre) {
      throw new NotFoundException('Genre not found');
    }

    return genre;
  }

  async findByName(name: string) {
    const genre = await this.prisma.genre.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
      include: {
        _count: {
          select: { movies: true, series: true },
        },
      },
    });

    if (!genre) {
      throw new NotFoundException(`Genre "${name}" not found`);
    }

    return genre;
  }

  async findBySlug(slug: string) {
    const genre = await this.prisma.genre.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { movies: true, series: true },
        },
      },
    });

    if (!genre) {
      throw new NotFoundException(`Genre with slug "${slug}" not found`);
    }

    return genre;
  }

  async create(dto: CreateGenreDto) {
    const slug = dto.slug || this.generateSlug(dto.name);

    const existing = await this.prisma.genre.findFirst({
      where: { OR: [{ name: dto.name }, { slug }] },
    });

    if (existing) {
      throw new ConflictException(
        existing.name === dto.name
          ? 'Genre with this name already exists'
          : 'Genre with this slug already exists',
      );
    }

    return this.prisma.genre.create({
      data: {
        name: dto.name,
        slug,
        emoji: dto.emoji,
      },
      include: {
        _count: {
          select: { movies: true, series: true },
        },
      },
    });
  }

  async update(id: string, dto: UpdateGenreDto) {
    await this.findById(id);

    const updateData: Prisma.GenreUpdateInput = {};

    if (dto.name !== undefined) {
      const existing = await this.prisma.genre.findFirst({
        where: { name: dto.name, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException('Genre with this name already exists');
      }
      updateData.name = dto.name;
    }

    if (dto.slug !== undefined) {
      const existing = await this.prisma.genre.findFirst({
        where: { slug: dto.slug, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException('Genre with this slug already exists');
      }
      updateData.slug = dto.slug;
    }

    if (dto.emoji !== undefined) {
      updateData.emoji = dto.emoji;
    }

    return this.prisma.genre.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { movies: true, series: true },
        },
      },
    });
  }

  async delete(id: string) {
    await this.findById(id);

    await this.prisma.genre.delete({ where: { id } });
    return { deleted: true };
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
