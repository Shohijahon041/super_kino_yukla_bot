import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsNotEmpty,
  IsIn,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MoodSearchDto {
  @ApiProperty({
    description: 'Mood query in Uzbek, Russian, or English',
    example: 'qo\'rqinchli',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  q: string;

  @ApiPropertyOptional({ description: 'Maximum results', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class NaturalSearchDto {
  @ApiProperty({
    description: 'Natural language search query',
    example: 'Comedy with Jackie Chan',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  query: string;

  @ApiPropertyOptional({ description: 'User ID for personalization' })
  @IsOptional()
  @IsUUID('4')
  userId?: string;
}

export class IdentifyMovieDto {
  @ApiProperty({
    description: 'Description of the movie to identify',
    example: "Bir film bor edi, qamoqdan qochish haqida...",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description: string;
}

export class SimilarContentParamsDto {
  @ApiProperty({
    description: 'Content type',
    enum: ['movie', 'series'],
  })
  @IsString()
  @IsIn(['movie', 'series'])
  contentType: 'movie' | 'series';

  @ApiProperty({ description: 'Content ID' })
  @IsString()
  @IsNotEmpty()
  id: string;
}

export class RecommendationQueryDto {
  @ApiPropertyOptional({ description: 'Maximum recommendations', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class AIResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty()
  data: any;

  @ApiProperty({ required: false })
  meta?: Record<string, any>;
}

export class RecommendationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ required: false })
  movieId?: string;

  @ApiProperty({ required: false })
  seriesId?: string;

  @ApiProperty()
  score: number;

  @ApiProperty({ required: false })
  reason?: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ required: false })
  movie?: any;

  @ApiProperty({ required: false })
  series?: any;
}
