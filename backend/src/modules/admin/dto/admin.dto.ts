import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  Max,
  IsNotEmpty,
  IsArray,
  IsIn,
  IsNumber,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DashboardStatsDto {
  @ApiProperty() totalMovies: number;
  @ApiProperty() totalSeries: number;
  @ApiProperty() totalUsers: number;
  @ApiProperty() activeToday: number;
  @ApiProperty() newUsersToday: number;
  @ApiProperty() totalViews: number;
  @ApiProperty({ type: [Object] }) topGenres: any[];
  @ApiProperty({ type: [Object] }) topCountries: any[];
}

export class BroadcastDto {
  @ApiProperty({ example: 'New Feature Update' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'We have added new categories...' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @ApiProperty({ enum: ['all', 'premium', 'specific'], default: 'all' })
  @IsString()
  @IsIn(['all', 'premium', 'specific'])
  targetType: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetIds?: string[];
}

export class GetBroadcastHistoryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  get skip(): number {
    return ((this.page ?? 1) - 1) * (this.limit ?? 20);
  }
}

export class BulkImportMovieDto {
  @ApiProperty({ example: 'Inception' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Inception' })
  @IsOptional()
  @IsString()
  originalTitle?: string;

  @ApiPropertyOptional({ example: 'A thief who steals corporate secrets...' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 2010 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1888)
  @Max(2100)
  year?: number;

  @ApiPropertyOptional({ example: 148 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  duration?: number;

  @ApiPropertyOptional({ example: 'PG-13', enum: ['G', 'PG', 'PG-13', 'R', 'NC-17', '18+'] })
  @IsOptional()
  @IsString()
  ageRating?: string;

  @ApiPropertyOptional({ example: '1080p', enum: ['4K', '1080p', '720p', '480p', 'CAM'] })
  @IsOptional()
  @IsString()
  quality?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  poster?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  backdrop?: string;

  @ApiPropertyOptional({ example: 'tt1375666' })
  @IsOptional()
  @IsString()
  imdbId?: string;

  @ApiPropertyOptional({ example: 27205 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  tmdbId?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  genres?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  countries?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  actors?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  directors?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class BulkImportDto {
  @ApiProperty({ type: [BulkImportMovieDto], description: 'Array of movies to import' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkImportMovieDto)
  movies: BulkImportMovieDto[];
}

export class BulkExportDto {
  @ApiPropertyOptional({ enum: ['csv', 'json'], default: 'json' })
  @IsOptional()
  @IsString()
  @IsIn(['csv', 'json'])
  format?: string = 'json';

  @ApiPropertyOptional({ description: 'Include inactive movies', default: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeInactive?: boolean;
}

export class GetAdminActionsDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  adminId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  targetType?: string;

  get skip(): number {
    return ((this.page ?? 1) - 1) * (this.limit ?? 50);
  }
}

export class AnalyticsPeriodDto {
  @ApiProperty({ enum: ['day', 'week', 'month'], default: 'week' })
  @IsString()
  @IsIn(['day', 'week', 'month'])
  period: 'day' | 'week' | 'month' = 'week';
}

export class FeatureMovieDto {
  @ApiProperty({ description: 'Movie ID to feature' })
  @IsString()
  @IsNotEmpty()
  movieId: string;
}

export class AdminActionLogDto {
  @ApiProperty({ description: 'Action performed', example: 'user_ban' })
  @IsString()
  @IsNotEmpty()
  action: string;

  @ApiPropertyOptional({ description: 'Target entity ID' })
  @IsOptional()
  @IsString()
  targetId?: string;

  @ApiPropertyOptional({ description: 'Target entity type', example: 'user', enum: ['movie', 'user', 'series', 'broadcast', 'system'] })
  @IsOptional()
  @IsString()
  @IsIn(['movie', 'user', 'series', 'broadcast', 'system'])
  targetType?: string;

  @ApiPropertyOptional({ description: 'Additional details' })
  @IsOptional()
  details?: Record<string, any>;
}
