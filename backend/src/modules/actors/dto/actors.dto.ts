import { IsString, IsOptional, IsNotEmpty, MinLength, MaxLength, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePersonDto {
  @ApiProperty({ description: 'Person name', example: 'Leonardo DiCaprio' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ description: 'URL-friendly slug', example: 'leonardo-dicaprio' })
  @IsOptional()
  @IsString()
  @MaxLength(220)
  slug?: string;

  @ApiPropertyOptional({ description: 'Avatar URL' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ description: 'Biography' })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  bio?: string;

  @ApiPropertyOptional({ description: 'IMDB ID', example: 'nm0000138' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  imdbId?: string;

  @ApiPropertyOptional({ description: 'TMDB ID', example: 6193 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  tmdbId?: number;
}

export class UpdatePersonDto {
  @ApiPropertyOptional({ description: 'Person name', example: 'Leonardo DiCaprio' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ description: 'URL-friendly slug' })
  @IsOptional()
  @IsString()
  @MaxLength(220)
  slug?: string;

  @ApiPropertyOptional({ description: 'Avatar URL' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ description: 'Biography' })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  bio?: string;

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
}
