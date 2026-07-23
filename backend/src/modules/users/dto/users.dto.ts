import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  Max,
  IsNotEmpty,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'Display username', example: 'cinema_lover' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  username?: string;

  @ApiPropertyOptional({ description: 'First name', example: 'John' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name', example: 'Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  lastName?: string;

  @ApiPropertyOptional({ description: 'Avatar URL' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ description: 'User bio', example: 'Movie enthusiast' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;
}

export class UpdateLanguageDto {
  @ApiProperty({ description: 'Language code', example: 'uz', enum: ['uz', 'ru', 'en', 'tr', 'en'] })
  @IsString()
  @IsNotEmpty()
  language!: string;
}

export class UserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  telegramId!: string;

  @ApiProperty({ required: false })
  username?: string;

  @ApiProperty({ required: false })
  firstName?: string;

  @ApiProperty({ required: false })
  lastName?: string;

  @ApiProperty({ required: false })
  avatar?: string;

  @ApiProperty({ required: false })
  bio?: string;

  @ApiProperty()
  language!: string;

  @ApiProperty()
  role!: string;

  @ApiProperty()
  isPremium!: boolean;

  @ApiProperty()
  xp!: number;

  @ApiProperty()
  level!: number;

  @ApiProperty()
  coins!: number;

  @ApiProperty()
  createdAt!: Date;
}

export class UserAchievementDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  icon!: string;

  @ApiProperty()
  tier!: string;

  @ApiProperty()
  unlockedAt!: Date;
}

export class UserProfileDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  telegramId!: string;

  @ApiProperty({ required: false })
  username?: string;

  @ApiProperty({ required: false })
  firstName?: string;

  @ApiProperty({ required: false })
  lastName?: string;

  @ApiProperty({ required: false })
  avatar?: string;

  @ApiProperty({ required: false })
  bio?: string;

  @ApiProperty()
  language!: string;

  @ApiProperty()
  role!: string;

  @ApiProperty()
  isPremium!: boolean;

  @ApiProperty()
  xp!: number;

  @ApiProperty()
  level!: number;

  @ApiProperty()
  coins!: number;

  @ApiProperty()
  streakCount!: number;

  @ApiProperty()
  referralCode!: string;

  @ApiProperty()
  favoritesCount!: number;

  @ApiProperty()
  watchHistoryCount!: number;

  @ApiProperty()
  reviewsCount!: number;

  @ApiProperty()
  totalWatchTimeMinutes!: number;

  @ApiProperty({ type: [UserAchievementDto] })
  achievements!: UserAchievementDto[];

  @ApiProperty()
  createdAt!: Date;
}

export class LeaderboardEntryDto {
  @ApiProperty()
  rank!: number;

  @ApiProperty()
  id!: string;

  @ApiProperty({ required: false })
  username?: string;

  @ApiProperty({ required: false })
  firstName?: string;

  @ApiProperty({ required: false })
  avatar?: string;

  @ApiProperty()
  xp!: number;

  @ApiProperty()
  level!: number;

  @ApiProperty()
  coins!: number;

  @ApiProperty()
  streakCount!: number;
}

export class DailyBonusResponseDto {
  @ApiProperty({ description: 'Bonus amount in coins', example: 100 })
  bonus!: number;

  @ApiProperty({ description: 'Current streak count', example: 5 })
  streak!: number;

  @ApiProperty({ description: 'Updated total coins', example: 1500 })
  totalCoins!: number;

  @ApiProperty({ description: 'Message describing the bonus', example: 'Daily bonus claimed! +500 coins (5 day streak)' })
  message!: string;
}

export class CheckInResponseDto {
  @ApiProperty({ description: 'XP earned from check-in', example: 50 })
  xpEarned!: number;

  @ApiProperty({ description: 'Coins earned from check-in', example: 100 })
  coinsEarned!: number;

  @ApiProperty({ description: 'Current streak count', example: 3 })
  streak!: number;

  @ApiProperty({ description: 'Updated level', example: 5 })
  level!: number;

  @ApiProperty({ description: 'Updated total XP', example: 4500 })
  totalXp!: number;

  @ApiProperty({ description: 'Message describing the check-in', example: 'Day 3 streak! Earned 50 XP and 100 coins' })
  message!: string;
}

export class UserStatsDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  username?: string;

  @ApiProperty()
  xp!: number;

  @ApiProperty()
  level!: number;

  @ApiProperty()
  coins!: number;

  @ApiProperty()
  streakCount!: number;

  @ApiProperty()
  favoritesCount!: number;

  @ApiProperty()
  watchHistoryCount!: number;

  @ApiProperty()
  completedWatchCount!: number;

  @ApiProperty()
  reviewsCount!: number;

  @ApiProperty()
  totalWatchTimeMinutes!: number;

  @ApiProperty()
  achievementsCount!: number;

  @ApiProperty()
  referralsCount!: number;

  @ApiProperty()
  loginCount!: number;

  @ApiProperty()
  isBanned!: boolean;

  @ApiProperty()
  isMuted!: boolean;

  @ApiProperty()
  createdAt!: Date;
}

export class BanUserDto {
  @ApiProperty({ description: 'Reason for banning', example: 'Violation of community guidelines' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;
}

export class MuteUserDto {
  @ApiProperty({ description: 'Mute duration in minutes', example: 60 })
  @IsInt()
  @Min(1)
  @Max(43200)
  duration!: number;
}
