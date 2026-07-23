import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { RedisService } from '../../config/redis.service';
import { PaginationDto, PaginatedResponse } from '../../common/dto/pagination.dto';

@Injectable()
export class ReferralsService {
  private readonly REFERRAL_REWARD = 100;
  private readonly REFERRER_BONUS = 50;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getReferralCode(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, referralCode: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      referralCode: user.referralCode,
      referralUrl: `https://t.me/CinemaHubBot?start=${user.referralCode}`,
    };
  }

  async processReferral(userId: string, code: string) {
    const referredUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!referredUser) {
      throw new NotFoundException('User not found');
    }

    if (referredUser.referredById) {
      throw new ConflictException('You have already been referred by another user');
    }

    const referrer = await this.prisma.user.findFirst({
      where: { referralCode: code },
    });

    if (!referrer) {
      throw new NotFoundException('Invalid referral code');
    }

    if (referrer.id === userId) {
      throw new BadRequestException('You cannot refer yourself');
    }

    const [updatedUser, referral] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { referredById: referrer.id },
      }),
      this.prisma.referral.create({
        data: {
          referrerId: referrer.id,
          referredId: userId,
          reward: this.REFERRAL_REWARD,
          status: 'completed',
        },
      }),
    ]);

    await this.prisma.user.update({
      where: { id: userId },
      data: { coins: { increment: this.REFERRAL_REWARD } },
    });

    await this.prisma.coinsLog.create({
      data: {
        userId,
        amount: this.REFERRAL_REWARD,
        reason: 'referral',
        metadata: { referrerId: referrer.id, code },
      },
    });

    await this.prisma.user.update({
      where: { id: referrer.id },
      data: { coins: { increment: this.REFERRER_BONUS } },
    });

    await this.prisma.coinsLog.create({
      data: {
        userId: referrer.id,
        amount: this.REFERRER_BONUS,
        reason: 'referral_bonus',
        metadata: { referredUserId: userId },
      },
    });

    await this.redis.del(`referrals:stats:${referrer.id}`);
    await this.redis.del(`referrals:leaderboard`);

    return {
      referrer: {
        id: referrer.id,
        username: referrer.username,
        firstName: referrer.firstName,
      },
      reward: this.REFERRAL_REWARD,
      referrerBonus: this.REFERRER_BONUS,
      message: `Welcome! You received ${this.REFERRAL_REWARD} coins. ${referrer.firstName ?? referrer.username} received ${this.REFERRER_BONUS} coins.`,
    };
  }

  async getReferralStats(userId: string) {
    const cacheKey = `referrals:stats:${userId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, referralCode: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [totalReferrals, completedReferrals, pendingReferrals, referrals] =
      await Promise.all([
        this.prisma.referral.count({ where: { referrerId: userId } }),
        this.prisma.referral.count({
          where: { referrerId: userId, status: 'completed' },
        }),
        this.prisma.referral.count({
          where: { referrerId: userId, status: 'pending' },
        }),
        this.prisma.referral.findMany({
          where: { referrerId: userId },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            referred: {
              select: {
                id: true,
                username: true,
                firstName: true,
                avatar: true,
                createdAt: true,
              },
            },
          },
        }),
      ]);

    const totalEarned =
      completedReferrals * this.REFERRER_BONUS;

    const stats = {
      referralCode: user.referralCode,
      totalReferrals,
      completedReferrals,
      pendingReferrals,
      totalEarned,
      recentReferrals: referrals.map((r) => ({
        id: r.id,
        referred: r.referred,
        reward: r.reward,
        status: r.status,
        createdAt: r.createdAt,
      })),
    };

    await this.redis.set(cacheKey, JSON.stringify(stats), 300);

    return stats;
  }

  async getReferralLeaderboard(limit = 50) {
    const cacheKey = 'referrals:leaderboard';
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const referrals = await this.prisma.referral.groupBy({
      by: ['referrerId'],
      where: { status: 'completed' },
      _count: { id: true },
      _sum: { reward: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });

    const userIds = referrals.map((r) => r.referrerId);

    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        username: true,
        firstName: true,
        avatar: true,
        level: true,
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const leaderboard = referrals.map((r, index) => ({
      rank: index + 1,
      user: userMap.get(r.referrerId),
      totalReferrals: r._count.id,
      totalEarned: r._sum.reward ?? 0,
    }));

    await this.redis.set(cacheKey, JSON.stringify(leaderboard), 300);

    return leaderboard;
  }

  async getReferredUsers(userId: string, dto: PaginationDto): Promise<PaginatedResponse<any>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const where = { referrerId: userId };

    const [data, total] = await Promise.all([
      this.prisma.referral.findMany({
        where,
        skip: dto.skip,
        take: dto.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          referred: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
              level: true,
              xp: true,
              createdAt: true,
            },
          },
        },
      }),
      this.prisma.referral.count({ where }),
    ]);

    return new PaginatedResponse(data, total, dto.page, dto.limit);
  }
}
