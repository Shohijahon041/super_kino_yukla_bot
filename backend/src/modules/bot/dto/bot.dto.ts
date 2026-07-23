import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString, IsObject, IsOptional } from 'class-validator';

export class WebhookDto {
  @ApiProperty({ description: 'Update ID from Telegram' })
  @IsNumber()
  update_id: number;

  @ApiPropertyOptional({ description: 'Message object' })
  @IsOptional()
  @IsObject()
  message?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Callback query object' })
  @IsOptional()
  @IsObject()
  callback_query?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Inline query object' })
  @IsOptional()
  @IsObject()
  inline_query?: Record<string, any>;
}

export class BotInfoDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  is_bot: boolean;

  @ApiProperty()
  first_name: string;

  @ApiPropertyOptional()
  username?: string;

  @ApiPropertyOptional()
  can_join_groups?: boolean;

  @ApiPropertyOptional()
  can_read_all_group_messages?: boolean;

  @ApiPropertyOptional()
  supports_inline_queries?: boolean;

  @ApiPropertyOptional()
  supports_file_payments?: boolean;
}

export class SetWebhookDto {
  @ApiProperty({ description: 'Webhook URL to set' })
  @IsString()
  url: string;

  @ApiPropertyOptional({ description: 'Secret token for webhook verification' })
  @IsOptional()
  @IsString()
  secret_token?: string;
}

export class WebhookResponseDto {
  @ApiProperty()
  ok: boolean;

  @ApiProperty()
  result: boolean;

  @ApiProperty()
  description: string;
}
