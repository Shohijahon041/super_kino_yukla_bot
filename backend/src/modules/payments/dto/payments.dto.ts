import {
  IsString,
  IsOptional,
  IsNumber,
  IsIn,
  IsNotEmpty,
  Min,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({ description: 'Payment amount', example: 29900, minimum: 1 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiPropertyOptional({ description: 'Currency code', default: 'UZS', example: 'UZS' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({
    description: 'Payment provider',
    enum: ['payme', 'click', 'stripe', 'uzum'],
    example: 'payme',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['payme', 'click', 'stripe', 'uzum'])
  provider: string;

  @ApiPropertyOptional({ description: 'Related subscription plan' })
  @IsOptional()
  @IsString()
  plan?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class PaymentCallbackDto {
  @ApiPropertyOptional({ description: 'Transaction ID from provider' })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiPropertyOptional({ description: 'Status from provider' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Provider signature' })
  @IsOptional()
  @IsString()
  signature?: string;

  @ApiPropertyOptional({ description: 'Raw callback data' })
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;
}

export class RefundPaymentDto {
  @ApiPropertyOptional({ description: 'Reason for refund' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class PaymentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  amount!: number;

  @ApiProperty()
  currency!: string;

  @ApiProperty()
  provider!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty({ required: false })
  externalId?: string;

  @ApiProperty({ required: false })
  metadata?: Record<string, unknown>;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
