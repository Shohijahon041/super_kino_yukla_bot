import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SearchQueryDto {
  @ApiProperty({ description: 'Search query', example: 'Inception' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  q: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: ['relevance', 'rating', 'year', 'createdAt', 'viewCount'],
    default: 'relevance',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}

export class AutocompleteQueryDto {
  @ApiProperty({ description: 'Partial search query', example: 'Ince' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  q: string;

  @ApiPropertyOptional({ description: 'Maximum autocomplete suggestions', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(25)
  limit?: number;
}

export class PopularSearchQueryDto {
  @ApiPropertyOptional({ description: 'Maximum popular searches', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class PersonSearchQueryDto {
  @ApiProperty({ description: 'Person name', example: 'Tom Hanks' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  q: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class SearchResponseDto {
  @ApiProperty()
  query: string;

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  data: any[];

  @ApiProperty({ required: false })
  suggestions?: string[];
}

export class AutocompleteResponseDto {
  @ApiProperty()
  query: string;

  @ApiProperty()
  suggestions: { title: string; slug: string; poster: string | null; contentType: string }[];
}

export class PopularSearchResponseDto {
  @ApiProperty()
  query: string;

  @ApiProperty()
  count: number;

  @ApiProperty()
  type: string;

  @ApiProperty()
  lastSearched: Date;
}
