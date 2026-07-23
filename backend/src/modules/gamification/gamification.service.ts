import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service';
import { PaginationDto, PaginatedResponse } from '../../common/dto/pagination.dto';
import { SpendCoinsDto, SpinWheelResultDto, MissionWithProgressDto } from './dto/gamification.dto';

const SPIN_WHEEL_PRIZES = [
  { type: 'coins' as const, value: 10, label: '+10 Coins', weight: 25 },
  { type: 'coins' as const, value: 25, label: '+25 Coins', weight: 20 },
  { type: 'coins' as const, value: 50, label: '+50 Coins', weight: 15 },
  { type: 'coins' as const, value: 100, label: '+100 Coins', weight: 10 },
  { type: 'coins' as const, value: 250, label: '+250 Coins', weight: 5 },
  { type: 'coins' as const, value: 500, label: '+500 Coins', weight: 2 },
  { type: 'xp' as const, value: 10, label: '+10 XP', weight: 20 },
  { type: 'xp' as const, value: 25, label: '+25 XP', weight: 15 },
  { type: 'xp' as const, value: 50, label: '+50 XP', weight: 10 },
  { type: 'xp' as const, value: 100, label: '+100 XP', weight: 5 },
  { type: 'premium_day' as const, value: 1, label: '1 Day Premium', weight: 2 },
  { type: 'nothing' as const, value: 0, label: 'Try Again', weight: 20 },
];

@Injectable()
export class GamificationService {
  constructor(private readonly prisma: PrismaService) {}

  async getMissions(userId: string): Promise<MissionWithProgressDto[]> {
    const missions = await this.prisma.mission.findMany({
      where: { isActive: true },
      orderBy: [{ type: 'asc' }, { createdAt: 'asc' }],
    });

    const userMissions = await this.prisma.userMission.findMany({
      where: { userId },
    });

    const userMissionMap = new Map(
      userMissions.map((um) => [um.missionId, um]),
    );

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const missionProgressValues = await this.computeMissionProgresses(userId, user);

    return missions.map((mission) => {
      const userMission = userMissionMap.get(mission.id);
      const computedProgress = missionProgressValues.get(mission.id) ?? 0;
      const progress = userMission ? Math.max(userMission.progress, computedProgress) : computedProgress;
      const completed = progress >= mission.target;

      return {
        id: mission.id,
        name: mission.name,
        description: mission.description,
        type: mission.type,
        target: mission.target,
        reward: mission.reward,
        coinReward: mission.coinReward,
        icon: mission.icon ?? undefined,
        progress: Math.min(progress, mission.target),
        completed,
        claimed: userMission?.completed ?? false,
      };
    });
  }

  async claimMissionReward(userId: string, missionId: string) {
    const mission = await this.prisma.mission.findUnique({ where: { id: missionId } });
    if (!mission) throw new NotFoundException('Mission not found');

    if (!mission.isActive) {
      throw new BadRequestException('Mission is not active');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const userMission = await this.prisma.userMission.findUnique({
      where: { userId_missionId: { userId, missionId } },
    });

    const computedProgress = (await this.computeMissionProgresses(userId, user)).get(missionId) ?? 0;
    const progress = userMission ? Math.max(userMission.progress, computedProgress) : computedProgress;

    if (progress < mission.target) {
      throw new BadRequestException('Mission not yet completed');
    }

    if (userMission?.completed) {
      throw new BadRequestException('Reward already claimed');
    }

    const newTotalXp = user.xp + mission.reward;
    const newLevel = Math.floor(newTotalXp / 1000) + 1;

    const [updatedUser] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          xp: { increment: mission.reward },
          level: newLevel,
          coins: mission.coinReward > 0 ? { increment: mission.coinReward } : undefined,
        },
      }),
      this.prisma.userMission.upsert({
        where: { userId_missionId: { userId, missionId } },
        create: {
          userId,
          missionId,
          progress,
          completed: true,
          completedAt: new Date(),
        },
        update: {
          progress,
          completed: true,
          completedAt: new Date(),
        },
      }),
      mission.coinReward > 0
        ? this.prisma.coinsLog.create({
            data: {
              userId,
              amount: mission.coinReward,
              reason: `mission:${mission.name}`,
              metadata: { missionId },
            },
          })
        : this.prisma.coinsLog.create({
            data: {
              userId,
              amount: 0,
              reason: `mission:${mission.name}`,
              metadata: { missionId },
            },
          }),
    ]);

    return {
      missionId: mission.id,
      xpEarned: mission.reward,
      coinsEarned: mission.coinReward,
      totalXp: updatedUser.xp,
      totalCoins: updatedUser.coins,
      level: updatedUser.level,
    };
  }

  async getAchievements(userId: string) {
    const userAchievements = await this.prisma.userAchievement.findMany({
      where: { userId },
      include: {
        achievement: true,
      },
      orderBy: { unlockedAt: 'desc' },
    });

    return userAchievements.map((ua) => ({
      id: ua.achievement.id,
      name: ua.achievement.name,
      description: ua.achievement.description,
      icon: ua.achievement.icon,
      tier: ua.achievement.tier,
      xpReward: ua.achievement.xpReward,
      coinReward: ua.achievement.coinReward,
      unlockedAt: ua.unlockedAt,
    }));
  }

  async getAllAchievements(userId: string) {
    const achievements = await this.prisma.achievement.findMany({
      orderBy: [{ tier: 'asc' }, { name: 'asc' }],
    });

    const userAchievements = await this.prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true, unlockedAt: true },
    });

    const unlockedMap = new Map(
      userAchievements.map((ua) => [ua.achievementId, ua.unlockedAt]),
    );

    return achievements.map((achievement) => ({
      id: achievement.id,
      name: achievement.name,
      description: achievement.description,
      icon: achievement.icon,
      tier: achievement.tier,
      xpReward: achievement.xpReward,
      coinReward: achievement.coinReward,
      unlocked: unlockedMap.has(achievement.id),
      unlockedAt: unlockedMap.get(achievement.id) ?? null,
    }));
  }

  async getSpinWheelResult(userId: string): Promise<SpinWheelResultDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const now = new Date();
    const lastSpinLog = await this.prisma.coinsLog.findFirst({
      where: {
        userId,
        reason: 'spin_wheel',
      },
      orderBy: { createdAt: 'desc' },
    });

    let spinsUsedToday = 0;
    if (lastSpinLog) {
      const lastSpinDate = new Date(lastSpinLog.createdAt);
      const isToday =
        lastSpinDate.getFullYear() === now.getFullYear() &&
        lastSpinDate.getMonth() === now.getMonth() &&
        lastSpinDate.getDate() === now.getDate();

      if (isToday) {
        const todaySpins = await this.prisma.coinsLog.count({
          where: {
            userId,
            reason: 'spin_wheel',
            createdAt: {
              gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            },
          },
        });
        spinsUsedToday = todaySpins;
      }
    }

    const maxDailySpins = user.isPremium ? 5 : 1;
    const spinsRemaining = maxDailySpins - spinsUsedToday;

    if (spinsRemaining <= 0) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      throw new BadRequestException({
        message: 'No spins remaining today',
        spinsRemaining: 0,
        nextSpinAt: tomorrow,
      });
    }

    const prize = this.pickWeightedPrize();

    if (prize.type === 'coins' && prize.value > 0) {
      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: userId },
          data: { coins: { increment: prize.value } },
        }),
        this.prisma.coinsLog.create({
          data: {
            userId,
            amount: prize.value,
            reason: 'spin_wheel',
            metadata: { prizeType: prize.type, prizeValue: prize.value },
          },
        }),
      ]);
    }

    if (prize.type === 'xp' && prize.value > 0) {
      const newTotalXp = user.xp + prize.value;
      const newLevel = Math.floor(newTotalXp / 1000) + 1;

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          xp: { increment: prize.value },
          level: newLevel,
        },
      });
    }

    if (prize.type === 'premium_day') {
      const currentPremiumEnd = user.premiumUntil && user.premiumUntil > now
        ? user.premiumUntil
        : now;
      const newPremiumEnd = new Date(currentPremiumEnd);
      newPremiumEnd.setDate(newPremiumEnd.getDate() + 1);

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          isPremium: true,
          premiumUntil: newPremiumEnd,
        },
      });
    }

    const nextSpinAt = spinsRemaining - 1 <= 0 ? (() => {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return tomorrow;
    })() : null;

    return {
      type: prize.type,
      value: prize.value,
      label: prize.label,
      spinsRemaining: spinsRemaining - 1,
      nextSpinAt,
    };
  }

  async getCoinsHistory(
    userId: string,
    dto: PaginationDto,
  ): Promise<PaginatedResponse<any>> {
    const where: Prisma.CoinsLogWhereInput = { userId };

    if (dto.search) {
      where.reason = { contains: dto.search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.coinsLog.findMany({
        where,
        skip: dto.skip,
        take: dto.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.coinsLog.count({ where }),
    ]);

    return new PaginatedResponse(data, total, dto.page, dto.limit);
  }

  async spendCoins(userId: string, dto: SpendCoinsDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.coins < dto.amount) {
      throw new BadRequestException(
        `Insufficient coins. You have ${user.coins}, need ${dto.amount}`,
      );
    }

    const [updatedUser] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { coins: { decrement: dto.amount } },
      }),
      this.prisma.coinsLog.create({
        data: {
          userId,
          amount: -dto.amount,
          reason: dto.reason,
        },
      }),
    ]);

    return {
      spent: dto.amount,
      reason: dto.reason,
      totalCoins: updatedUser.coins,
    };
  }

  private pickWeightedPrize() {
    const totalWeight = SPIN_WHEEL_PRIZES.reduce((sum, p) => sum + p.weight, 0);
    let random = Math.random() * totalWeight;

    for (const prize of SPIN_WHEEL_PRIZES) {
      random -= prize.weight;
      if (random <= 0) {
        return prize;
      }
    }

    return SPIN_WHEEL_PRIZES[SPIN_WHEEL_PRIZES.length - 1];
  }

  private async computeMissionProgresses(
    userId: string,
    user: { xp: number; level: number; streakCount: number },
  ): Promise<Map<string, number>> {
    const progressMap = new Map<string, number>();

    const [watchCount, favoritesCount, reviewsCount] = await Promise.all([
      this.prisma.watchHistory.count({ where: { userId } }),
      this.prisma.favorite.count({ where: { userId } }),
      this.prisma.review.count({ where: { userId } }),
    ]);

    const missions = await this.prisma.mission.findMany({
      where: { isActive: true },
    });

    for (const mission of missions) {
      const condition = mission.description.toLowerCase();
      let progress = 0;

      if (condition.includes('watch')) {
        progress = watchCount;
      } else if (condition.includes('favorite')) {
        progress = favoritesCount;
      } else if (condition.includes('review')) {
        progress = reviewsCount;
      } else if (condition.includes('streak') || condition.includes('check')) {
        progress = user.streakCount;
      } else if (condition.includes('level')) {
        progress = user.level;
      } else if (condition.includes('xp')) {
        progress = user.xp;
      }

      progressMap.set(mission.id, progress);
    }

    return progressMap;
  }
}
