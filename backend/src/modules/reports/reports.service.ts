import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service';
import { PaginationDto, PaginatedResponse } from '../../common/dto/pagination.dto';
import { CreateReportDto, UpdateReportStatusDto } from './dto/reports.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async createReport(userId: string, dto: CreateReportDto) {
    if (!dto.movieId && !dto.seriesId) {
      throw new NotFoundException('Either movieId or seriesId must be provided');
    }

    if (dto.movieId) {
      const movie = await this.prisma.movie.findUnique({ where: { id: dto.movieId } });
      if (!movie) throw new NotFoundException('Movie not found');
    }

    if (dto.seriesId) {
      const series = await this.prisma.series.findUnique({ where: { id: dto.seriesId } });
      if (!series) throw new NotFoundException('Series not found');
    }

    return this.prisma.report.create({
      data: {
        userId,
        movieId: dto.movieId,
        seriesId: dto.seriesId,
        reason: dto.reason,
        message: dto.message,
        status: 'pending',
      },
      include: {
        movie: {
          select: { id: true, title: true, slug: true },
        },
        series: {
          select: { id: true, title: true, slug: true },
        },
        user: {
          select: { id: true, username: true, firstName: true },
        },
      },
    });
  }

  async getReports(dto: PaginationDto): Promise<PaginatedResponse<any>> {
    const where: Prisma.ReportWhereInput = {};

    if (dto.search) {
      where.OR = [
        { reason: { contains: dto.search, mode: 'insensitive' } },
        { message: { contains: dto.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.ReportOrderByWithRelationInput = {};
    if (dto.sortBy && dto.sortBy in ['createdAt', 'status', 'id']) {
      orderBy[dto.sortBy as 'createdAt'] = dto.sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    const [data, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        skip: dto.skip,
        take: dto.limit,
        orderBy,
        include: {
          movie: {
            select: { id: true, title: true, slug: true, poster: true },
          },
          series: {
            select: { id: true, title: true, slug: true, poster: true },
          },
          user: {
            select: { id: true, username: true, firstName: true },
          },
        },
      }),
      this.prisma.report.count({ where }),
    ]);

    return new PaginatedResponse(data, total, dto.page, dto.limit);
  }

  async updateReportStatus(id: string, dto: UpdateReportStatusDto, adminId: string) {
    const report = await this.prisma.report.findUnique({ where: { id } });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return this.prisma.report.update({
      where: { id },
      data: {
        status: dto.status,
        reviewedBy: adminId,
      },
      include: {
        movie: {
          select: { id: true, title: true, slug: true },
        },
        series: {
          select: { id: true, title: true, slug: true },
        },
        user: {
          select: { id: true, username: true, firstName: true },
        },
      },
    });
  }
}
