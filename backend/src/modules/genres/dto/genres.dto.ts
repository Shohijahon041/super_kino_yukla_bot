import { IsString, IsOptional, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGenreDto {
  @ApiProperty({ description: 'Genre name', example: 'Action' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'URL-friendly slug', example: 'action' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  slug?: string;

  @ApiPropertyOptional({ description: 'Emoji icon', example: '🎬' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  emoji?: string;
}

export class UpdateGenreDto {
  @ApiPropertyOptional({ description: 'Genre name', example: 'Action' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'URL-friendly slug', example: 'action' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  slug?: string;

  @ApiPropertyOptional({ description: 'Emoji icon', example: '🎬' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  emoji?: string;
}
