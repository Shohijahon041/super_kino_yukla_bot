import { IsString, IsInt, Min, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SpendCoinsDto {
  @ApiProperty({ description: 'Amount to spend', example: 100 })
  @IsInt()
  @Min(1)
  amount: number;

  @ApiProperty({ description: 'Reason for spending', example: 'premium_day' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class SpinWheelResultDto {
  @ApiProperty({ description: 'Prize type', example: 'coins' })
  type: 'coins' | 'xp' | 'premium_day' | 'nothing';

  @ApiProperty({ description: 'Prize value', example: 250 })
  value: number;

  @ApiProperty({ description: 'Prize label', example: '+250 Coins' })
  label: string;

  @ApiProperty({ description: 'Remaining spins today', example: 1 })
  spinsRemaining: number;

  @ApiProperty({ description: 'Next spin available at' })
  nextSpinAt: Date | null;
}

export class MissionWithProgressDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  target: number;

  @ApiProperty()
  reward: number;

  @ApiProperty()
  coinReward: number;

  @ApiProperty({ required: false })
  icon?: string;

  @ApiProperty()
  progress: number;

  @ApiProperty()
  completed: boolean;

  @ApiProperty()
  claimed: boolean;
}
