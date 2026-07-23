import { IsString, IsOptional, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCountryDto {
  @ApiProperty({ description: 'Country name', example: 'South Korea' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'ISO 3166-1 alpha-2 code', example: 'KR' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(2)
  code: string;

  @ApiPropertyOptional({ description: 'Flag emoji', example: '🇰🇷' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  flag?: string;
}

export class UpdateCountryDto {
  @ApiPropertyOptional({ description: 'Country name', example: 'South Korea' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'ISO 3166-1 alpha-2 code', example: 'KR' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(2)
  code?: string;

  @ApiPropertyOptional({ description: 'Flag emoji', example: '🇰🇷' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  flag?: string;
}
