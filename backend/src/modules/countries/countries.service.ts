import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service';
import { PaginationDto, PaginatedResponse } from '../../common/dto/pagination.dto';
import { CreateCountryDto, UpdateCountryDto } from './dto/countries.dto';

@Injectable()
export class CountriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(dto: PaginationDto): Promise<PaginatedResponse<any>> {
    const where: Prisma.CountryWhereInput = {};

    if (dto.search) {
      where.OR = [
        { name: { contains: dto.search, mode: 'insensitive' } },
        { code: { contains: dto.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.CountryOrderByWithRelationInput = {};
    if (dto.sortBy && dto.sortBy in ['name', 'code', 'id']) {
      orderBy[dto.sortBy as 'name' | 'code'] = dto.sortOrder;
    } else {
      orderBy.name = 'asc';
    }

    const [data, total] = await Promise.all([
      this.prisma.country.findMany({
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
      this.prisma.country.count({ where }),
    ]);

    return new PaginatedResponse(data, total, dto.page, dto.limit);
  }

  async findById(id: string) {
    const country = await this.prisma.country.findUnique({
      where: { id },
      include: {
        _count: {
          select: { movies: true, series: true },
        },
      },
    });

    if (!country) {
      throw new NotFoundException('Country not found');
    }

    return country;
  }

  async findByCode(code: string) {
    const country = await this.prisma.country.findFirst({
      where: { code: { equals: code, mode: 'insensitive' } },
      include: {
        _count: {
          select: { movies: true, series: true },
        },
      },
    });

    if (!country) {
      throw new NotFoundException(`Country with code "${code}" not found`);
    }

    return country;
  }

  async create(dto: CreateCountryDto) {
    const existing = await this.prisma.country.findFirst({
      where: { OR: [{ name: dto.name }, { code: { equals: dto.code, mode: 'insensitive' } }] },
    });

    if (existing) {
      throw new ConflictException(
        existing.name === dto.name
          ? 'Country with this name already exists'
          : 'Country with this code already exists',
      );
    }

    return this.prisma.country.create({
      data: {
        name: dto.name,
        code: dto.code.toUpperCase(),
        flag: dto.flag,
      },
      include: {
        _count: {
          select: { movies: true, series: true },
        },
      },
    });
  }

  async update(id: string, dto: UpdateCountryDto) {
    await this.findById(id);

    const updateData: Prisma.CountryUpdateInput = {};

    if (dto.name !== undefined) {
      const existing = await this.prisma.country.findFirst({
        where: { name: dto.name, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException('Country with this name already exists');
      }
      updateData.name = dto.name;
    }

    if (dto.code !== undefined) {
      const existing = await this.prisma.country.findFirst({
        where: { code: { equals: dto.code, mode: 'insensitive' }, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException('Country with this code already exists');
      }
      updateData.code = dto.code.toUpperCase();
    }

    if (dto.flag !== undefined) {
      updateData.flag = dto.flag;
    }

    return this.prisma.country.update({
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

    await this.prisma.country.delete({ where: { id } });
    return { deleted: true };
  }
}
