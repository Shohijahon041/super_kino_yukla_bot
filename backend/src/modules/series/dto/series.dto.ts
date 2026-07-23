import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  Max,
  IsNotEmpty,
  IsArray,
  IsNumber,
  IsIn,
  MinLength,
  MaxLength,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSeriesDto {
  @ApiProperty({ description: 'Series title', example: 'Breaking Bad' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(500)
  title: string;

  @ApiPropertyOptional({ description: 'Original title', example: 'Breaking Bad' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  originalTitle?: string;

  @ApiPropertyOptional({ description: 'Series description' })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  description?: string;

  @ApiPropertyOptional({ description: 'Short description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  shortDesc?: string;

  @ApiPropertyOptional({ description: 'Release year', example: 2008 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1888)
  @Max(2100)
  year?: number;

  @ApiPropertyOptional({ description: 'Release date' })
  @IsOptional()
  releaseDate?: Date;

  @ApiPropertyOptional({
    description: 'Series status',
    example: 'ongoing',
    enum: ['ongoing', 'completed', 'cancelled'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['ongoing', 'completed', 'cancelled'])
  status?: string;

  @ApiPropertyOptional({ description: 'Total number of seasons', example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  totalSeasons?: number;

  @ApiPropertyOptional({ description: 'Total number of episodes', example: 62 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10000)
  totalEpisodes?: number;

  @ApiPropertyOptional({ description: 'Age rating', example: 'TV-MA', enum: ['G', 'PG', 'PG-13', 'R', 'NC-17', '18+', 'TV-Y', 'TV-Y7', 'TV-G', 'TV-PG', 'TV-14', 'TV-MA'] })
  @IsOptional()
  @IsString()
  @IsIn(['G', 'PG', 'PG-13', 'R', 'NC-17', '18+', 'TV-Y', 'TV-Y7', 'TV-G', 'TV-PG', 'TV-14', 'TV-MA'])
  ageRating?: string;

  @ApiProperty({ description: 'Genre IDs', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  genres: string[];

  @ApiProperty({ description: 'Country IDs', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  countries: string[];

  @ApiProperty({ description: 'Language IDs', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  languages: string[];

  @ApiPropertyOptional({ description: 'Actor person IDs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  actors?: string[];

  @ApiPropertyOptional({ description: 'Director person IDs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  directors?: string[];

  @ApiPropertyOptional({ description: 'Poster URL' })
  @IsOptional()
  @IsString()
  poster?: string;

  @ApiPropertyOptional({ description: 'Backdrop URL' })
  @IsOptional()
  @IsString()
  backdrop?: string;

  @ApiPropertyOptional({ description: 'IMDB ID', example: 'tt0903747' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  imdbId?: string;

  @ApiPropertyOptional({ description: 'TMDB ID', example: 1396 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  tmdbId?: number;

  @ApiPropertyOptional({ description: 'Is featured', default: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isFeatured?: boolean;
}

export class UpdateSeriesDto {
  @ApiPropertyOptional({ description: 'Series title' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title?: string;

  @ApiPropertyOptional({ description: 'Original title' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  originalTitle?: string;

  @ApiPropertyOptional({ description: 'Series description' })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  description?: string;

  @ApiPropertyOptional({ description: 'Short description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  shortDesc?: string;

  @ApiPropertyOptional({ description: 'Release year' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1888)
  @Max(2100)
  year?: number;

  @ApiPropertyOptional({ description: 'Release date' })
  @IsOptional()
  releaseDate?: Date;

  @ApiPropertyOptional({
    description: 'Series status',
    enum: ['ongoing', 'completed', 'cancelled'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['ongoing', 'completed', 'cancelled'])
  status?: string;

  @ApiPropertyOptional({ description: 'Total number of seasons' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  totalSeasons?: number;

  @ApiPropertyOptional({ description: 'Total number of episodes' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10000)
  totalEpisodes?: number;

  @ApiPropertyOptional({ description: 'Age rating', enum: ['G', 'PG', 'PG-13', 'R', 'NC-17', '18+', 'TV-Y', 'TV-Y7', 'TV-G', 'TV-PG', 'TV-14', 'TV-MA'] })
  @IsOptional()
  @IsString()
  @IsIn(['G', 'PG', 'PG-13', 'R', 'NC-17', '18+', 'TV-Y', 'TV-Y7', 'TV-G', 'TV-PG', 'TV-14', 'TV-MA'])
  ageRating?: string;

  @ApiPropertyOptional({ description: 'Genre IDs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  genres?: string[];

  @ApiPropertyOptional({ description: 'Country IDs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  countries?: string[];

  @ApiPropertyOptional({ description: 'Language IDs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  languages?: string[];

  @ApiPropertyOptional({ description: 'Actor person IDs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  actors?: string[];

  @ApiPropertyOptional({ description: 'Director person IDs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  directors?: string[];

  @ApiPropertyOptional({ description: 'Poster URL' })
  @IsOptional()
  @IsString()
  poster?: string;

  @ApiPropertyOptional({ description: 'Backdrop URL' })
  @IsOptional()
  @IsString()
  backdrop?: string;

  @ApiPropertyOptional({ description: 'IMDB ID' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  imdbId?: string;

  @ApiPropertyOptional({ description: 'TMDB ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  tmdbId?: number;

  @ApiPropertyOptional({ description: 'Is featured' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ description: 'Is active' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}

export class FilterSeriesDto {
  @ApiPropertyOptional({ description: 'Filter by genre ID' })
  @IsOptional()
  @IsString()
  genre?: string;

  @ApiPropertyOptional({ description: 'Filter by year' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1888)
  @Max(2100)
  year?: number;

  @ApiPropertyOptional({ description: 'Filter by country ID' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'Filter by language ID' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: ['ongoing', 'completed', 'cancelled'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['ongoing', 'completed', 'cancelled'])
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by age rating', enum: ['G', 'PG', 'PG-13', 'R', 'NC-17', '18+', 'TV-Y', 'TV-Y7', 'TV-G', 'TV-PG', 'TV-14', 'TV-MA'] })
  @IsOptional()
  @IsString()
  ageRating?: string;

  @ApiPropertyOptional({ description: 'Filter featured series only' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({
    description: 'Sort by field',
    default: 'createdAt',
    enum: ['createdAt', 'year', 'rating', 'viewCount', 'title'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['createdAt', 'year', 'rating', 'viewCount', 'title'])
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

export class CreateSeasonDto {
  @ApiProperty({ description: 'Season number', example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  number: number;

  @ApiPropertyOptional({ description: 'Season title', example: 'Season 1' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ description: 'Season description' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ description: 'Season poster URL' })
  @IsOptional()
  @IsString()
  poster?: string;

  @ApiPropertyOptional({ description: 'Season year' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1888)
  @Max(2100)
  year?: number;
}

export class CreateEpisodeDto {
  @ApiProperty({ description: 'Episode number', example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  number: number;

  @ApiProperty({ description: 'Episode title', example: 'Pilot' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  title: string;

  @ApiPropertyOptional({ description: 'Episode description' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({ description: 'Duration in minutes', example: 45 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  duration?: number;

  @ApiPropertyOptional({ description: 'Air date' })
  @IsOptional()
  airDate?: Date;

  @ApiPropertyOptional({ description: 'Episode poster URL' })
  @IsOptional()
  @IsString()
  poster?: string;

  @ApiPropertyOptional({ description: 'Telegram file ID' })
  @IsOptional()
  @IsString()
  telegramFileId?: string;

  @ApiPropertyOptional({ description: 'Cloud storage URL' })
  @IsOptional()
  @IsString()
  cloudUrl?: string;

  @ApiPropertyOptional({ description: 'Quality', enum: ['4K', '1080p', '720p', '480p', 'CAM'] })
  @IsOptional()
  @IsString()
  @IsIn(['4K', '1080p', '720p', '480p', 'CAM'])
  quality?: string;

  @ApiPropertyOptional({ description: 'File size in bytes', example: 1073741824 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  fileSize?: number;
}

export class UpdateEpisodeDto {
  @ApiPropertyOptional({ description: 'Episode number' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  number?: number;

  @ApiPropertyOptional({ description: 'Episode title' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title?: string;

  @ApiPropertyOptional({ description: 'Episode description' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({ description: 'Duration in minutes' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  duration?: number;

  @ApiPropertyOptional({ description: 'Air date' })
  @IsOptional()
  airDate?: Date;

  @ApiPropertyOptional({ description: 'Episode poster URL' })
  @IsOptional()
  @IsString()
  poster?: string;

  @ApiPropertyOptional({ description: 'Telegram file ID' })
  @IsOptional()
  @IsString()
  telegramFileId?: string;

  @ApiPropertyOptional({ description: 'Cloud storage URL' })
  @IsOptional()
  @IsString()
  cloudUrl?: string;

  @ApiPropertyOptional({ description: 'Quality', enum: ['4K', '1080p', '720p', '480p', 'CAM'] })
  @IsOptional()
  @IsString()
  @IsIn(['4K', '1080p', '720p', '480p', 'CAM'])
  quality?: string;

  @ApiPropertyOptional({ description: 'File size in bytes' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  fileSize?: number;
}

export class SeriesResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: number;

  @ApiProperty()
  title: string;

  @ApiProperty({ required: false })
  originalTitle?: string;

  @ApiProperty()
  slug: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false })
  shortDesc?: string;

  @ApiProperty({ required: false })
  year?: number;

  @ApiProperty({ required: false })
  releaseDate?: Date;

  @ApiProperty()
  status: string;

  @ApiProperty()
  totalSeasons: number;

  @ApiProperty()
  totalEpisodes: number;

  @ApiProperty({ required: false })
  ageRating?: string;

  @ApiProperty({ required: false })
  imdbId?: string;

  @ApiProperty({ required: false })
  tmdbId?: number;

  @ApiProperty()
  rating: number;

  @ApiProperty()
  ratingCount: number;

  @ApiProperty()
  viewCount: number;

  @ApiProperty()
  isFeatured: boolean;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ required: false })
  poster?: string;

  @ApiProperty({ required: false })
  backdrop?: string;

  @ApiProperty({ type: [Object] })
  genres: any[];

  @ApiProperty({ type: [Object] })
  countries: any[];

  @ApiProperty({ type: [Object] })
  languages: any[];

  @ApiProperty({ type: [Object] })
  actors: any[];

  @ApiProperty({ type: [Object] })
  directors: any[];

  @ApiProperty({ type: [Object] })
  seasons: any[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class EpisodeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  seasonId: string;

  @ApiProperty()
  number: number;

  @ApiProperty()
  title: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false })
  duration?: number;

  @ApiProperty({ required: false })
  airDate?: Date;

  @ApiProperty({ required: false })
  poster?: string;

  @ApiProperty({ required: false })
  telegramFileId?: string;

  @ApiProperty({ required: false })
  cloudUrl?: string;

  @ApiProperty({ required: false })
  quality?: string;

  @ApiProperty({ required: false })
  fileSize?: bigint;

  @ApiProperty()
  viewCount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
