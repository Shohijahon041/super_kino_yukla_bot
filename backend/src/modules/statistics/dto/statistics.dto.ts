import { IsString, IsOptional, IsEnum, IsDateString, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum StatGranularity {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export enum StatEntityType {
  MOVIE = 'movie',
  SERIES = 'series',
}

export class TrackViewDto {
  @ApiProperty({ description: 'Entity type', enum: ['movie', 'series'] })
  @IsEnum(['movie', 'series'])
  entityType: 'movie' | 'series';

  @ApiProperty({ description: 'Entity ID (UUID)' })
  @IsString()
  entityId: string;

  @ApiPropertyOptional({ description: 'User ID (if authenticated)' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Country code', example: 'UZ' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'Device type', example: 'mobile' })
  @IsOptional()
  @IsString()
  device?: string;

  @ApiPropertyOptional({ description: 'Duration watched in seconds' })
  @IsOptional()
  @IsInt()
  watchDuration?: number;
}

export class DailyStatsQueryDto {
  @ApiPropertyOptional({ description: 'Start date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: StatGranularity, default: StatGranularity.DAILY })
  @IsOptional()
  @IsEnum(StatGranularity)
  granularity?: StatGranularity;
}
