import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
  Query,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { BotService } from './bot.service';
import { SetWebhookDto } from './dto/bot.dto';

@ApiTags('Bot')
@Controller('bot')
export class BotController {
  private readonly logger = new Logger(BotController.name);

  constructor(private readonly botService: BotService) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive Telegram webhook updates' })
  async handleWebhook(
    @Body() update: Record<string, any>,
    @Headers('x-telegram-bot-api-secret-token') secretToken?: string,
  ) {
    if (!update || typeof update.update_id !== 'number') {
      throw new BadRequestException('Invalid Telegram update');
    }

    this.logger.debug(`Received update #${update.update_id}`);

    try {
      await this.botService.handleUpdate(update);
    } catch (error) {
      this.logger.error(`Error handling update #${update.update_id}: ${error.message}`);
    }

    return { ok: true };
  }

  @Get('info')
  @ApiOperation({ summary: 'Get bot information' })
  async getBotInfo() {
    const info = this.botService.getBotInfo();
    if (!info) {
      return { status: 'Bot not initialized', bot: null };
    }
    return { status: 'active', bot: info };
  }

  @Post('set-webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set bot webhook URL (admin)' })
  @ApiBody({ type: SetWebhookDto })
  async setWebhook(@Body() dto: SetWebhookDto) {
    const result = await this.botService.setWebhook(dto.url, dto.secret_token);
    return result;
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get bot statistics' })
  async getStats() {
    return this.botService.getStats();
  }
}
