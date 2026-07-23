import { IsString, IsOptional, IsNotEmpty, IsIn, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReportDto {
  @ApiPropertyOptional({ description: 'Movie UUID' })
  @IsOptional()
  @IsUUID('4')
  movieId?: string;

  @ApiPropertyOptional({ description: 'Series UUID' })
  @IsOptional()
  @IsUUID('4')
  seriesId?: string;

  @ApiProperty({
    description: 'Report reason',
    example: 'broken_link',
    enum: ['broken_link', 'wrong_info', 'inappropriate', 'copyright', 'other'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['broken_link', 'wrong_info', 'inappropriate', 'copyright', 'other'])
  reason: string;

  @ApiPropertyOptional({ description: 'Additional message' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;
}

export class UpdateReportStatusDto {
  @ApiProperty({
    description: 'New status',
    example: 'resolved',
    enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['pending', 'reviewed', 'resolved', 'dismissed'])
  status: string;
}
