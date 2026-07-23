import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { TelegramLoginDto } from '../dto/auth.dto';

@Injectable()
export class TelegramStrategy extends PassportStrategy(Strategy, 'telegram') {
  private readonly botToken: string;

  constructor(configService: ConfigService) {
    super();
    this.botToken = configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!this.botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN is not configured');
    }
  }

  async validate(req: { body: TelegramLoginDto }): Promise<TelegramLoginDto> {
    const { id, first_name, last_name, username, photo_url, auth_date, hash } = req.body;

    this.verifyTelegramAuth({
      id,
      first_name,
      last_name,
      username,
      photo_url,
      auth_date,
      hash,
    });

    const now = Math.floor(Date.now() / 1000);
    if (now - auth_date > 86400) {
      throw new UnauthorizedException('Telegram authentication data has expired');
    }

    return { id, first_name, last_name, username, photo_url, auth_date, hash };
  }

  private verifyTelegramAuth(data: TelegramLoginDto): void {
    const { hash, ...rest } = data;

    const checkString = Object.keys(rest)
      .sort()
      .filter((key) => rest[key as keyof typeof rest] !== undefined)
      .map((key) => `${key}=${rest[key as keyof typeof rest]}`)
      .join('\n');

    const secretKey = crypto
      .createHash('sha256')
      .update(this.botToken)
      .digest();

    const hmac = crypto
      .createHmac('sha256', secretKey)
      .update(checkString)
      .digest('hex');

    if (hmac !== hash) {
      throw new UnauthorizedException('Invalid Telegram authentication hash');
    }
  }
}
