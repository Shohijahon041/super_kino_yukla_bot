import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  Max,
  MinLength,
  MaxLength,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiPropertyOptional({ description: 'Rating 1-10', minimum: 1, maximum: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  rating?: number;

  @ApiPropertyOptional({ description: 'Review title' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ description: 'Review content' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  content?: string;

  @ApiPropertyOptional({ description: 'Contains spoilers', default: false })
  @IsOptional()
  @IsBoolean()
  spoiler?: boolean;
}

export class UpdateReviewDto {
  @ApiPropertyOptional({ description: 'Rating 1-10' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  rating?: number;

  @ApiPropertyOptional({ description: 'Review title' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ description: 'Review content' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  content?: string;

  @ApiPropertyOptional({ description: 'Contains spoilers' })
  @IsOptional()
  @IsBoolean()
  spoiler?: boolean;
}

export class AddReactionDto {
  @ApiProperty({
    description: 'Emoji reaction',
    enum: ['👍', '❤️', '😂', '😮', '😢', '🔥'],
  })
  @IsString()
  @IsIn(['👍', '❤️', '😂', '😮', '😢', '🔥'])
  emoji: string;
}

export class ReportReviewDto {
  @ApiProperty({ description: 'Report reason' })
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  reason: string;
}
