import { IsString, IsNumber, IsOptional, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TelegramLoginDto {
  @ApiProperty({ description: 'Telegram user ID', example: 123456789 })
  @IsNumber()
  id: number;

  @ApiPropertyOptional({ description: 'User first name', example: 'John' })
  @IsString()
  @IsOptional()
  first_name?: string;

  @ApiPropertyOptional({ description: 'User last name', example: 'Doe' })
  @IsString()
  @IsOptional()
  last_name?: string;

  @ApiPropertyOptional({ description: 'Telegram username', example: 'johndoe' })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiPropertyOptional({ description: 'Profile photo URL' })
  @IsString()
  @IsOptional()
  photo_url?: string;

  @ApiProperty({ description: 'Unix timestamp of authentication', example: 1690000000 })
  @IsNumber()
  auth_date: number;

  @ApiProperty({ description: 'Hash for verification from Telegram', example: 'a1b2c3d4e5f6...' })
  @IsString()
  hash: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token to exchange for a new access token' })
  @IsString()
  @MinLength(1)
  refreshToken: string;
}

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  telegramId: string;

  @ApiProperty({ required: false })
  username?: string;

  @ApiProperty({ required: false })
  firstName?: string;

  @ApiProperty({ required: false })
  lastName?: string;

  @ApiProperty({ required: false })
  photoUrl?: string;

  @ApiProperty()
  role: string;

  @ApiProperty({ type: [String] })
  permissions: string[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT access token' })
  accessToken: string;

  @ApiProperty({ description: 'Refresh token for obtaining new access tokens' })
  refreshToken: string;

  @ApiProperty({ description: 'Authenticated user details', type: UserResponseDto })
  user: UserResponseDto;
}
