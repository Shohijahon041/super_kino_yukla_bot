import { IsString, IsOptional, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLanguageDto {
  @ApiProperty({ description: 'Language name', example: 'Korean' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'ISO 639-1 code', example: 'ko' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(2)
  code: string;
}

export class UpdateLanguageDto {
  @ApiPropertyOptional({ description: 'Language name', example: 'Korean' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'ISO 639-1 code', example: 'ko' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(2)
  code?: string;
}
