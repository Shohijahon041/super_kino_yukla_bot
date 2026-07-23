import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../config/prisma.service';
import { TelegramLoginDto } from './dto/auth.dto';
import * as crypto from 'crypto';

interface JwtPayload {
  sub: string;
  role?: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
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

    const telegramId = BigInt(telegramData.id);

    let user = await this.prisma.user.findUnique({
      where: { telegramId },
      include: { role: { include: { permissions: true } } },
    });

    if (user && user.isBanned) {
      throw new ForbiddenException('Your account has been banned');
    }

    if (!user) {
      const defaultRole = await this.prisma.role.findUnique({
        where: { name: 'user' },
        include: { permissions: true },
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
          avatar: telegramData.photo_url ?? null,
          roleId: defaultRole.id,
        },
        include: { role: { include: { permissions: true } } },
      });
    } else {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          username: telegramData.username ?? user.username,
          firstName: telegramData.first_name ?? user.firstName,
          lastName: telegramData.last_name ?? user.lastName,
          avatar: telegramData.photo_url ?? user.avatar,
        },
        include: { role: { include: { permissions: true } } },
      });
    }

    const tokens = await this.generateTokenPair(user.id, user.role?.name ?? 'user');
    await this.createSession(user.id, tokens.refreshToken, ipAddress, userAgent);

    const permissions = user.role?.permissions?.map((rp) => `${rp.resource}:${rp.action}`) ?? [];

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
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
    const session = await this.prisma.userSession.findFirst({
      where: {
        refreshToken,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          include: { role: true },
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

    await this.createSession(session.userId, tokens.refreshToken, ipAddress, userAgent);

    return tokens;
  }

  async logout(sessionId: string, userId?: string): Promise<{ message: string }> {
    const whereClause: any = { id: sessionId };
    if (userId) {
      whereClause.userId = userId;
    }

    const session = await this.prisma.userSession.findFirst({
      where: whereClause,
    });

    if (!session) {
      throw new UnauthorizedException('Session not found');
    }

    await this.prisma.userSession.update({
      where: { id: session.id },
      data: { isActive: false },
    });

    return { message: 'Logged out successfully' };
  }

  async logoutAllSessions(userId: string): Promise<{ message: string; count: number }> {
    const result = await this.prisma.userSession.updateMany({
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

  async adminLogin(email: string, password: string): Promise<TokenPair & { user: any }> {
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL', 'admin@cinemahub.ai');
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD', 'admin123');

    if (email !== adminEmail || password !== adminPassword) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    const adminRole = await this.prisma.role.findUnique({
      where: { name: 'admin' },
      include: { permissions: true },
    });

    if (!adminRole) {
      throw new Error('Admin role not found in database');
    }

    let user = await this.prisma.user.findFirst({
      where: { roleId: adminRole.id },
      include: { role: { include: { permissions: true } } },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          telegramId: BigInt(0),
          username: 'admin',
          firstName: 'Admin',
          roleId: adminRole.id,
        },
        include: { role: { include: { permissions: true } } },
      });
    }

    const tokens = await this.generateTokenPair(user.id, user.role?.name ?? 'admin');
    await this.createSession(user.id, tokens.refreshToken);

    const permissions = user.role?.permissions?.map((rp) => `${rp.resource}:${rp.action}`) ?? [];

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        role: user.role?.name ?? 'admin',
        permissions,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: { include: { permissions: true } } },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.isBanned) {
      throw new ForbiddenException('Your account has been banned');
    }

    const permissions = user.role?.permissions?.map((rp) => `${rp.resource}:${rp.action}`) ?? [];

    return {
      id: user.id,
      telegramId: user.telegramId,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      role: user.role?.name ?? 'user',
      permissions,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async getUserSessions(userId: string) {
    return this.prisma.userSession.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        token: true,
        ip: true,
        device: true,
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
    const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
    const expiresAt = this.calculateExpiry(refreshExpiresIn);

    return this.prisma.userSession.create({
      data: {
        userId,
        token: refreshToken,
        refreshToken,
        ip: ipAddress ?? null,
        device: userAgent ?? null,
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

    const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: refreshExpiresIn,
    });

    return { accessToken, refreshToken };
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
    await this.prisma.userSession.update({
      where: { id: sessionId },
      data: { isActive: false },
    });
  }
}
