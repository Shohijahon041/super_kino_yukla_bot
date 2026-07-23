import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { TelegramLoginDto } from './dto/auth.dto';
import * as crypto from 'crypto';

interface JwtPayload {
  sub: string;
  email?: string;
  username?: string;
  role?: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface SessionInfo {
  id: string;
  userId: string;
  refreshTokenHash: string;
  ipAddress: string | null;
  userAgent: string | null;
  isActive: boolean;
  createdAt: Date;
  expiresAt: Date;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateTelegramAuth(telegramData: TelegramLoginDto): Promise<boolean> {
    const { hash, auth_date, ...rest } = telegramData;

    const now = Math.floor(Date.now() / 1000);
    if (now - auth_date > 86400) {
      throw new UnauthorizedException('Telegram authentication data has expired');
    }

    const botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN is not configured');
    }

    const checkString = Object.keys(rest)
      .sort()
      .filter((key) => rest[key as keyof typeof rest] !== undefined)
      .map((key) => `${key}=${rest[key as keyof typeof rest]}`)
      .join('\n');

    const secretKey = crypto
      .createHash('sha256')
      .update(botToken)
      .digest();

    const hmac = crypto
      .createHmac('sha256', secretKey)
      .update(checkString)
      .digest('hex');

    if (hmac !== hash) {
      throw new UnauthorizedException('Invalid Telegram authentication hash');
    }

    return true;
  }

  async login(
    telegramData: TelegramLoginDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<TokenPair & { user: any }> {
    await this.validateTelegramAuth(telegramData);

    const telegramId = String(telegramData.id);

    let user = await this.prisma.user.findUnique({
      where: { telegramId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (user && user.isBanned) {
      throw new ForbiddenException('Your account has been banned');
    }

    if (!user) {
      const defaultRole = await this.prisma.role.findUnique({
        where: { name: 'user' },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      if (!defaultRole) {
        throw new Error('Default role "user" not found in database');
      }

      user = await this.prisma.user.create({
        data: {
          telegramId,
          username: telegramData.username ?? null,
          firstName: telegramData.first_name ?? null,
          lastName: telegramData.last_name ?? null,
          photoUrl: telegramData.photo_url ?? null,
          roleId: defaultRole.id,
        },
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      });
    } else {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          username: telegramData.username ?? user.username,
          firstName: telegramData.first_name ?? user.firstName,
          lastName: telegramData.last_name ?? user.lastName,
          photoUrl: telegramData.photo_url ?? user.photoUrl,
          lastLoginAt: new Date(),
        },
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      });
    }

    const tokens = await this.generateTokenPair(user.id, user.role?.name ?? 'user');

    await this.createSession(user.id, tokens.refreshToken, ipAddress, userAgent);

    const permissions = user.role?.permissions?.map((rp) => rp.permission.name) ?? [];

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        photoUrl: user.photoUrl,
        role: user.role?.name ?? 'user',
        permissions,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  async refreshTokens(
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<TokenPair> {
    const tokenHash = this.hashToken(refreshToken);

    const session = await this.prisma.session.findFirst({
      where: {
        refreshTokenHash: tokenHash,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          include: {
            role: {
              include: {
                permissions: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (session.user.isBanned) {
      await this.deactivateSession(session.id);
      throw new ForbiddenException('Your account has been banned');
    }

    await this.deactivateSession(session.id);

    const tokens = await this.generateTokenPair(
      session.userId,
      session.user.role?.name ?? 'user',
    );

    await this.createSession(
      session.userId,
      tokens.refreshToken,
      ipAddress ?? session.ipAddress,
      userAgent ?? session.userAgent,
    );

    return tokens;
  }

  async logout(sessionId: string, userId?: string): Promise<{ message: string }> {
    const whereClause: any = { id: sessionId };
    if (userId) {
      whereClause.userId = userId;
    }

    const session = await this.prisma.session.findFirst({
      where: whereClause,
    });

    if (!session) {
      throw new UnauthorizedException('Session not found');
    }

    await this.prisma.session.update({
      where: { id: session.id },
      data: { isActive: false },
    });

    return { message: 'Logged out successfully' };
  }

  async logoutAllSessions(userId: string): Promise<{ message: string; count: number }> {
    const result = await this.prisma.session.updateMany({
      where: {
        userId,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    return {
      message: 'All sessions terminated',
      count: result.count,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.isBanned) {
      throw new ForbiddenException('Your account has been banned');
    }

    const permissions = user.role?.permissions?.map((rp) => rp.permission.name) ?? [];

    return {
      id: user.id,
      telegramId: user.telegramId,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      photoUrl: user.photoUrl,
      role: user.role?.name ?? 'user',
      permissions,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async getUserSessions(userId: string): Promise<SessionInfo[]> {
    return this.prisma.session.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        refreshTokenHash: true,
        ipAddress: true,
        userAgent: true,
        isActive: true,
        createdAt: true,
        expiresAt: true,
      },
    });
  }

  async createSession(
    userId: string,
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<any> {
    const refreshTokenHash = this.hashToken(refreshToken);
    const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
    const expiresAt = this.calculateExpiry(refreshExpiresIn);

    return this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
        isActive: true,
        expiresAt,
      },
    });
  }

  private async generateTokenPair(
    userId: string,
    roleName: string,
  ): Promise<TokenPair> {
    const payload: JwtPayload = {
      sub: userId,
      role: roleName,
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshPayload: JwtPayload = {
      sub: userId,
      role: roleName,
    };

    const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
    const refreshToken = this.jwtService.sign(refreshPayload, {
      expiresIn: refreshExpiresIn,
    });

    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private calculateExpiry(duration: string): Date {
    const now = Date.now();
    const match = duration.match(/^(\d+)([smhd])$/);

    if (!match) {
      return new Date(now + 7 * 24 * 60 * 60 * 1000);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return new Date(now + value * (multipliers[unit] ?? 0));
  }

  private async deactivateSession(sessionId: string): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { isActive: false },
    });
  }
}
