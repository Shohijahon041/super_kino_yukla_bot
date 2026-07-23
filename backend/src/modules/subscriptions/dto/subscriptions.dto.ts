import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  IsIn,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubscriptionDto {
  @ApiProperty({
    description: 'Subscription plan',
    enum: ['monthly', 'yearly', 'lifetime'],
    example: 'monthly',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['monthly', 'yearly', 'lifetime'])
  plan: string;

  @ApiPropertyOptional({ description: 'Payment ID to link' })
  @IsOptional()
  @IsString()
  paymentId?: string;

  @ApiPropertyOptional({ description: 'Auto-renew subscription', default: false })
  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;
}

export class ExtendSubscriptionDto {
  @ApiProperty({ description: 'Number of months to extend', example: 1, minimum: 1, maximum: 12 })
  @IsInt()
  @Min(1)
  months: number;

  @ApiPropertyOptional({ description: 'Reason for extension' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class SubscriptionResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  plan!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  startDate!: Date;

  @ApiProperty({ required: false })
  endDate?: Date;

  @ApiProperty()
  autoRenew!: boolean;

  @ApiProperty({ required: false })
  paymentId?: string;

  @ApiProperty()
  createdAt!: Date;
}

export class SubscriptionHistoryEntryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  plan!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  startDate!: Date;

  @ApiProperty({ required: false })
  endDate?: Date;

  @ApiProperty()
  autoRenew!: boolean;

  @ApiProperty({ required: false })
  paymentId?: string;

  @ApiProperty()
  createdAt!: Date;
}
