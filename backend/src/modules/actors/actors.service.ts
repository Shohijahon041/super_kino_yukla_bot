import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service';
import { PaginationDto, PaginatedResponse } from '../../common/dto/pagination.dto';
import { CreatePersonDto, UpdatePersonDto } from './dto/actors.dto';

@Injectable()
export class ActorsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(dto: PaginationDto): Promise<PaginatedResponse<any>> {
    const where: Prisma.PersonWhereInput = {};

    if (dto.search) {
      where.OR = [
        { name: { contains: dto.search, mode: 'insensitive' } },
        { bio: { contains: dto.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.PersonOrderByWithRelationInput = {};
    if (dto.sortBy && dto.sortBy in ['name', 'createdAt', 'id']) {
      orderBy[dto.sortBy as 'name'] = dto.sortOrder;
    } else {
      orderBy.name = 'asc';
    }

    const [data, total] = await Promise.all([
      this.prisma.person.findMany({
        where,
        skip: dto.skip,
        take: dto.limit,
        orderBy,
        include: {
          _count: {
            select: {
              movieActor: true,
              movieDirector: true,
              seriesActor: true,
              seriesDirector: true,
            },
          },
        },
      }),
      this.prisma.person.count({ where }),
    ]);

    return new PaginatedResponse(data, total, dto.page, dto.limit);
  }

  async findById(id: string) {
    const person = await this.prisma.person.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            movieActor: true,
            movieDirector: true,
            seriesActor: true,
            seriesDirector: true,
          },
        },
      },
    });

    if (!person) {
      throw new NotFoundException('Person not found');
    }

    return person;
  }

  async findBySlug(slug: string) {
    const person = await this.prisma.person.findUnique({
      where: { slug },
      include: {
        _count: {
          select: {
            movieActor: true,
            movieDirector: true,
            seriesActor: true,
            seriesDirector: true,
          },
        },
      },
    });

    if (!person) {
      throw new NotFoundException(`Person with slug "${slug}" not found`);
    }

    return person;
  }

  async search(query: string, dto: PaginationDto): Promise<PaginatedResponse<any>> {
    if (!query || query.trim().length === 0) {
      throw new BadRequestException('Search query is required');
    }

    const where: Prisma.PersonWhereInput = {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { bio: { contains: query, mode: 'insensitive' } },
      ],
    };

    const [data, total] = await Promise.all([
      this.prisma.person.findMany({
        where,
        skip: dto.skip,
        take: dto.limit,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              movieActor: true,
              movieDirector: true,
              seriesActor: true,
              seriesDirector: true,
            },
          },
        },
      }),
      this.prisma.person.count({ where }),
    ]);

    return new PaginatedResponse(data, total, dto.page, dto.limit);
  }

  async create(dto: CreatePersonDto) {
    const slug = dto.slug || this.generateSlug(dto.name);

    const existing = await this.prisma.person.findFirst({
      where: { slug },
    });

    if (existing) {
      throw new ConflictException('Person with this slug already exists');
    }

    return this.prisma.person.create({
      data: {
        name: dto.name,
        slug,
        avatar: dto.avatar,
        bio: dto.bio,
        imdbId: dto.imdbId,
        tmdbId: dto.tmdbId,
      },
    });
  }

  async update(id: string, dto: UpdatePersonDto) {
    await this.findById(id);

    const updateData: Prisma.PersonUpdateInput = {};

    if (dto.name !== undefined) {
      updateData.name = dto.name;
    }

    if (dto.slug !== undefined) {
      const existing = await this.prisma.person.findFirst({
        where: { slug: dto.slug, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException('Person with this slug already exists');
      }
      updateData.slug = dto.slug;
    }

    if (dto.avatar !== undefined) updateData.avatar = dto.avatar;
    if (dto.bio !== undefined) updateData.bio = dto.bio;
    if (dto.imdbId !== undefined) updateData.imdbId = dto.imdbId;
    if (dto.tmdbId !== undefined) updateData.tmdbId = dto.tmdbId;

    return this.prisma.person.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string) {
    const person = await this.findById(id);

    const hasRelations =
      person._count.movieActor > 0 ||
      person._count.movieDirector > 0 ||
      person._count.seriesActor > 0 ||
      person._count.seriesDirector > 0;

    if (hasRelations) {
      throw new BadRequestException(
        'Cannot delete person with existing movie/series relations. Remove all relations first.',
      );
    }

    await this.prisma.person.delete({ where: { id } });
    return { deleted: true };
  }

  async getFilmography(id: string) {
    const person = await this.findById(id);

    const [movieActorRoles, movieDirectorRoles, seriesActorRoles, seriesDirectorRoles] =
      await Promise.all([
        this.prisma.movieActor.findMany({
          where: { personId: id },
          include: {
            movie: {
              select: {
                id: true,
                title: true,
                slug: true,
                poster: true,
                year: true,
                rating: true,
                duration: true,
              },
            },
          },
          orderBy: { movie: { year: 'desc' } },
        }),
        this.prisma.movieDirector.findMany({
          where: { personId: id },
          include: {
            movie: {
              select: {
                id: true,
                title: true,
                slug: true,
                poster: true,
                year: true,
                rating: true,
                duration: true,
              },
            },
          },
          orderBy: { movie: { year: 'desc' } },
        }),
        this.prisma.seriesActor.findMany({
          where: { personId: id },
          include: {
            series: {
              select: {
                id: true,
                title: true,
                slug: true,
                poster: true,
                year: true,
                rating: true,
                status: true,
              },
            },
          },
          orderBy: { series: { year: 'desc' } },
        }),
        this.prisma.seriesDirector.findMany({
          where: { personId: id },
          include: {
            series: {
              select: {
                id: true,
                title: true,
                slug: true,
                poster: true,
                year: true,
                rating: true,
                status: true,
              },
            },
          },
          orderBy: { series: { year: 'desc' } },
        }),
      ]);

    return {
      person: {
        id: person.id,
        name: person.name,
        slug: person.slug,
        avatar: person.avatar,
        bio: person.bio,
      },
      filmography: {
        actedInMovies: movieActorRoles.map((r) => ({
          ...r.movie,
          role: 'actor',
        })),
        directedMovies: movieDirectorRoles.map((r) => ({
          ...r.movie,
          role: 'director',
        })),
        actedInSeries: seriesActorRoles.map((r) => ({
          ...r.series,
          role: 'actor',
        })),
        directedSeries: seriesDirectorRoles.map((r) => ({
          ...r.series,
          role: 'director',
        })),
      },
      totalCredits:
        movieActorRoles.length +
        movieDirectorRoles.length +
        seriesActorRoles.length +
        seriesDirectorRoles.length,
    };
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
