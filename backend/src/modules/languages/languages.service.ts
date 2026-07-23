import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service';
import { PaginationDto, PaginatedResponse } from '../../common/dto/pagination.dto';
import { CreateLanguageDto, UpdateLanguageDto } from './dto/languages.dto';

@Injectable()
export class LanguagesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(dto: PaginationDto): Promise<PaginatedResponse<any>> {
    const where: Prisma.LanguageWhereInput = {};

    if (dto.search) {
      where.OR = [
        { name: { contains: dto.search, mode: 'insensitive' } },
        { code: { contains: dto.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.LanguageOrderByWithRelationInput = {};
    if (dto.sortBy && dto.sortBy in ['name', 'code', 'id']) {
      orderBy[dto.sortBy as 'name' | 'code'] = dto.sortOrder;
    } else {
      orderBy.name = 'asc';
    }

    const [data, total] = await Promise.all([
      this.prisma.language.findMany({
        where,
        skip: dto.skip,
        take: dto.limit,
        orderBy,
        include: {
          _count: {
            select: { movies: true, series: true, subtitles: true },
          },
        },
      }),
      this.prisma.language.count({ where }),
    ]);

    return new PaginatedResponse(data, total, dto.page, dto.limit);
  }

  async findById(id: string) {
    const language = await this.prisma.language.findUnique({
      where: { id },
      include: {
        _count: {
          select: { movies: true, series: true, subtitles: true },
        },
      },
    });

    if (!language) {
      throw new NotFoundException('Language not found');
    }

    return language;
  }

  async findByCode(code: string) {
    const language = await this.prisma.language.findFirst({
      where: { code: { equals: code, mode: 'insensitive' } },
      include: {
        _count: {
          select: { movies: true, series: true, subtitles: true },
        },
      },
    });

    if (!language) {
      throw new NotFoundException(`Language with code "${code}" not found`);
    }

    return language;
  }

  async create(dto: CreateLanguageDto) {
    const existing = await this.prisma.language.findFirst({
      where: { OR: [{ name: dto.name }, { code: { equals: dto.code, mode: 'insensitive' } }] },
    });

    if (existing) {
      throw new ConflictException(
        existing.name === dto.name
          ? 'Language with this name already exists'
          : 'Language with this code already exists',
      );
    }

    return this.prisma.language.create({
      data: {
        name: dto.name,
        code: dto.code.toLowerCase(),
      },
      include: {
        _count: {
          select: { movies: true, series: true, subtitles: true },
        },
      },
    });
  }

  async update(id: string, dto: UpdateLanguageDto) {
    await this.findById(id);

    const updateData: Prisma.LanguageUpdateInput = {};

    if (dto.name !== undefined) {
      const existing = await this.prisma.language.findFirst({
        where: { name: dto.name, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException('Language with this name already exists');
      }
      updateData.name = dto.name;
    }

    if (dto.code !== undefined) {
      const existing = await this.prisma.language.findFirst({
        where: { code: { equals: dto.code, mode: 'insensitive' }, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException('Language with this code already exists');
      }
      updateData.code = dto.code.toLowerCase();
    }

    return this.prisma.language.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { movies: true, series: true, subtitles: true },
        },
      },
    });
  }

  async delete(id: string) {
    await this.findById(id);

    await this.prisma.language.delete({ where: { id } });
    return { deleted: true };
  }
}
