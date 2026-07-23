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
  ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CreateMovieDto {
  @ApiProperty({ description: 'Movie title', example: 'Inception' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(500)
  title: string;

  @ApiPropertyOptional({ description: 'Original title', example: 'Inception' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  originalTitle?: string;

  @ApiPropertyOptional({ description: 'Movie description', example: 'A thief who steals corporate secrets...' })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  description?: string;

  @ApiPropertyOptional({ description: 'Release year', example: 2010 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1888)
  @Max(2100)
  year?: number;

  @ApiPropertyOptional({ description: 'Duration in minutes', example: 148 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  duration?: number;

  @ApiPropertyOptional({ description: 'Age rating', example: 'PG-13', enum: ['G', 'PG', 'PG-13', 'R', 'NC-17', '18+'] })
  @IsOptional()
  @IsString()
  @IsIn(['G', 'PG', 'PG-13', 'R', 'NC-17', '18+'])
  ageRating?: string;

  @ApiPropertyOptional({ description: 'Quality', example: '1080p', enum: ['4K', '1080p', '720p', '480p', 'CAM'] })
  @IsOptional()
  @IsString()
  @IsIn(['4K', '1080p', '720p', '480p', 'CAM'])
  quality?: string;

  @ApiPropertyOptional({ description: 'Resolution', example: '1920x1080' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  resolution?: string;

  @ApiPropertyOptional({ description: 'File size in bytes', example: 2147483648 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  fileSize?: number;

  @ApiPropertyOptional({ description: 'File format', example: 'mkv' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  format?: string;

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

  @ApiPropertyOptional({ description: 'Trailer URL' })
  @IsOptional()
  @IsString()
  trailer?: string;

  @ApiPropertyOptional({ description: 'Telegram file ID' })
  @IsOptional()
  @IsString()
  telegramFileId?: string;

  @ApiPropertyOptional({ description: 'Cloud storage URL' })
  @IsOptional()
  @IsString()
  cloudUrl?: string;

  @ApiPropertyOptional({ description: 'Tags', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'IMDB ID', example: 'tt1375666' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  imdbId?: string;

  @ApiPropertyOptional({ description: 'TMDB ID', example: 27205 })
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

export class UpdateMovieDto {
  @ApiPropertyOptional({ description: 'Movie title', example: 'Inception' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title?: string;

  @ApiPropertyOptional({ description: 'Original title', example: 'Inception' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  originalTitle?: string;

  @ApiPropertyOptional({ description: 'Movie description' })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  description?: string;

  @ApiPropertyOptional({ description: 'Release year' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1888)
  @Max(2100)
  year?: number;

  @ApiPropertyOptional({ description: 'Duration in minutes' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  duration?: number;

  @ApiPropertyOptional({ description: 'Age rating', enum: ['G', 'PG', 'PG-13', 'R', 'NC-17', '18+'] })
  @IsOptional()
  @IsString()
  @IsIn(['G', 'PG', 'PG-13', 'R', 'NC-17', '18+'])
  ageRating?: string;

  @ApiPropertyOptional({ description: 'Quality', enum: ['4K', '1080p', '720p', '480p', 'CAM'] })
  @IsOptional()
  @IsString()
  @IsIn(['4K', '1080p', '720p', '480p', 'CAM'])
  quality?: string;

  @ApiPropertyOptional({ description: 'Resolution' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  resolution?: string;

  @ApiPropertyOptional({ description: 'File size in bytes' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  fileSize?: number;

  @ApiPropertyOptional({ description: 'File format' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  format?: string;

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

  @ApiPropertyOptional({ description: 'Trailer URL' })
  @IsOptional()
  @IsString()
  trailer?: string;

  @ApiPropertyOptional({ description: 'Telegram file ID' })
  @IsOptional()
  @IsString()
  telegramFileId?: string;

  @ApiPropertyOptional({ description: 'Cloud storage URL' })
  @IsOptional()
  @IsString()
  cloudUrl?: string;

  @ApiPropertyOptional({ description: 'Tags', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

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

export class FilterMovieDto extends PaginationDto {
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

  @ApiPropertyOptional({ description: 'Filter by quality', enum: ['4K', '1080p', '720p', '480p', 'CAM'] })
  @IsOptional()
  @IsString()
  quality?: string;

  @ApiPropertyOptional({ description: 'Filter by age rating', enum: ['G', 'PG', 'PG-13', 'R', 'NC-17', '18+'] })
  @IsOptional()
  @IsString()
  ageRating?: string;

  @ApiPropertyOptional({ description: 'Filter featured movies only' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isFeatured?: boolean;
}

export class MovieResponseDto {
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

  @ApiProperty({ required: false })
  duration?: number;

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
  downloadCount: number;

  @ApiProperty()
  likeCount: number;

  @ApiProperty()
  dislikeCount: number;

  @ApiProperty()
  isFeatured: boolean;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ required: false })
  poster?: string;

  @ApiProperty({ required: false })
  backdrop?: string;

  @ApiProperty({ required: false })
  trailer?: string;

  @ApiProperty({ required: false })
  telegramFileId?: string;

  @ApiProperty({ required: false })
  cloudUrl?: string;

  @ApiProperty({ required: false })
  quality?: string;

  @ApiProperty({ required: false })
  resolution?: string;

  @ApiProperty({ required: false })
  fileSize?: bigint;

  @ApiProperty({ required: false })
  format?: string;

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
  screenshots: any[];

  @ApiProperty({ type: [Object] })
  subtitles: any[];

  @ApiProperty({ type: [Object] })
  tags: any[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class MovieListDto {
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
  year?: number;

  @ApiProperty({ required: false })
  duration?: number;

  @ApiProperty({ required: false })
  ageRating?: string;

  @ApiProperty()
  rating: number;

  @ApiProperty()
  viewCount: number;

  @ApiProperty()
  likeCount: number;

  @ApiProperty()
  isFeatured: boolean;

  @ApiProperty({ required: false })
  poster?: string;

  @ApiProperty({ required: false })
  backdrop?: string;

  @ApiProperty({ required: false })
  quality?: string;

  @ApiProperty({ type: [Object] })
  genres: any[];

  @ApiProperty({ type: [Object] })
  countries: any[];

  @ApiProperty()
  createdAt: Date;
}
