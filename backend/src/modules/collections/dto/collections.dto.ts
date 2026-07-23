import { IsString, IsOptional, IsBoolean, IsArray, IsUUID, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCollectionDto {
  @ApiProperty({ description: 'Collection name', example: 'My Favorites' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Collection description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Is collection public', default: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: 'Poster URL' })
  @IsOptional()
  @IsString()
  poster?: string;
}

export class UpdateCollectionDto {
  @ApiPropertyOptional({ description: 'Collection name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Collection description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Is collection public' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: 'Poster URL' })
  @IsOptional()
  @IsString()
  poster?: string;
}

export class AddCollectionItemDto {
  @ApiPropertyOptional({ description: 'Movie UUID' })
  @IsOptional()
  @IsUUID('4')
  movieId?: string;

  @ApiPropertyOptional({ description: 'Series UUID' })
  @IsOptional()
  @IsUUID('4')
  seriesId?: string;
}

export class ReorderItemsDto {
  @ApiProperty({ description: 'Ordered item IDs', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  itemIds: string[];
}
