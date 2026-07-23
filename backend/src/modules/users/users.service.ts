import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import {
  UpdateUserDto,
  UserProfileDto,
  LeaderboardEntryDto,
  DailyBonusResponseDto,
  CheckInResponseDto,
  UserStatsDto,
} from './dto/users.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByTelegramId(telegramId: bigint) {
    return this.prisma.user.findUnique({
      where: { telegramId },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async create(data: {
    telegramId: bigint;
    username?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    roleId: string;
  }) {
    return this.prisma.user.create({
      data: {
        telegramId: data.telegramId,
        username: data.username ?? null,
        firstName: data.firstName ?? null,
        lastName: data.lastName ?? null,
        avatar: data.avatar ?? null,
        roleId: data.roleId,
      },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    });
  }

  async update(id: string, data: UpdateUserDto) {
    const user = await this.findById(id);

    if (user.isBanned) {
      throw new BadRequestException('Cannot update a banned account');
    }

    const updateData: Record<string, unknown> = {};

    if (data.username !== undefined) {
      if (data.username !== user.username) {
        const existing = await this.prisma.user.findFirst({
          where: {
            username: data.username,
            id: { not: id },
          },
        });
        if (existing) {
          throw new ConflictException('Username is already taken');
        }
      }
      updateData.username = data.username;
    }

    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.avatar !== undefined) updateData.avatar = data.avatar;
    if (data.bio !== undefined) updateData.bio = data.bio;

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        role: true,
      },
    });
  }

  async updateLanguage(id: string, lang: string) {
    await this.findById(id);

    return this.prisma.user.update({
      where: { id },
      data: { language: lang },
      select: {
        id: true,
        language: true,
      },
    });
  }

  async getProfile(id: string): Promise<UserProfileDto> {
    const user = await this.findById(id);

    const [favoritesCount, watchHistoryCount, reviewsCount, watchTimeResult, achievements] =
      await Promise.all([
        this.prisma.favorite.count({ where: { userId: id } }),
        this.prisma.watchHistory.count({ where: { userId: id } }),
        this.prisma.review.count({ where: { userId: id } }),
        this.prisma.watchHistory.aggregate({
          where: { userId: id },
          _sum: { progress: true },
        }),
        this.prisma.userAchievement.findMany({
          where: { userId: id },
          include: { achievement: true },
          orderBy: { unlockedAt: 'desc' },
        }),
      ]);

    const totalWatchTimeMinutes = Math.floor(
      (watchTimeResult._sum.progress ?? 0) / 60,
    );

    return {
      id: user.id,
      telegramId: String(user.telegramId),
      username: user.username ?? undefined,
      firstName: user.firstName ?? undefined,
      lastName: user.lastName ?? undefined,
      avatar: user.avatar ?? undefined,
      bio: user.bio ?? undefined,
      language: user.language,
      role: user.role?.name ?? 'user',
      isPremium: user.isPremium,
      xp: user.xp,
      level: user.level,
      coins: user.coins,
      streakCount: user.streakCount,
      referralCode: user.referralCode,
      favoritesCount,
      watchHistoryCount,
      reviewsCount,
      totalWatchTimeMinutes,
      achievements: achievements.map((a) => ({
        id: a.achievement.id,
        name: a.achievement.name,
        description: a.achievement.description,
        icon: a.achievement.icon,
        tier: a.achievement.tier,
        unlockedAt: a.unlockedAt,
      })),
      createdAt: user.createdAt,
    };
  }

  async getLeaderboard(limit: number = 50): Promise<LeaderboardEntryDto[]> {
    const topUsers = await this.prisma.user.findMany({
      where: { isActive: true, isBanned: false },
      orderBy: [{ xp: 'desc' }, { level: 'desc' }],
      take: limit,
      select: {
        id: true,
        username: true,
        firstName: true,
        avatar: true,
        xp: true,
        level: true,
        coins: true,
        streakCount: true,
      },
    });

    return topUsers.map((user, index) => ({
      rank: index + 1,
      id: user.id,
      username: user.username ?? undefined,
      firstName: user.firstName ?? undefined,
      avatar: user.avatar ?? undefined,
      xp: user.xp,
      level: user.level,
      coins: user.coins,
      streakCount: user.streakCount,
    }));
  }

  async addXP(userId: string, amount: number) {
    if (amount <= 0) {
      throw new BadRequestException('XP amount must be positive');
    }

    const user = await this.findById(userId);

    if (user.isBanned) {
      throw new BadRequestException('Cannot add XP to a banned account');
    }

    const newTotalXp = user.xp + amount;
    const newLevel = Math.floor(newTotalXp / 1000) + 1;
    const leveledUp = newLevel > user.level;

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        xp: { increment: amount },
        level: newLevel,
      },
    });

    if (leveledUp) {
      await this.checkAchievements(userId);
    }

    return {
      xpAdded: amount,
      totalXp: updatedUser.xp,
      level: updatedUser.level,
      leveledUp,
      previousLevel: user.level,
    };
  }

  async addCoins(userId: string, amount: number, reason: string) {
    if (amount <= 0) {
      throw new BadRequestException('Coin amount must be positive');
    }

    const user = await this.findById(userId);

    if (user.isBanned) {
      throw new BadRequestException('Cannot add coins to a banned account');
    }

    const [updatedUser] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { coins: { increment: amount } },
      }),
      this.prisma.coinsLog.create({
        data: {
          userId,
          amount,
          reason,
        },
      }),
    ]);

    return {
      coinsAdded: amount,
      totalCoins: updatedUser.coins,
      reason,
    };
  }

  async checkDailyBonus(userId: string): Promise<DailyBonusResponseDto> {
    const user = await this.findById(userId);

    if (user.isBanned) {
      throw new BadRequestException('Account is banned');
    }

    const now = new Date();
    const lastBonus = user.lastDailyBonus;

    if (lastBonus) {
      const lastBonusDate = new Date(lastBonus);
      const diffMs = now.getTime() - lastBonusDate.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours < 20) {
        throw new BadRequestException('Daily bonus already claimed. Come back later.');
      }
    }

    const isConsecutive =
      lastBonus &&
      (() => {
        const lastDate = new Date(lastBonus);
        const today = new Date(now);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return (
          lastDate.getFullYear() === yesterday.getFullYear() &&
          lastDate.getMonth() === yesterday.getMonth() &&
          lastDate.getDate() === yesterday.getDate()
        );
      })();

    const newStreak = isConsecutive ? user.streakCount + 1 : 1;
    const bonus = 100 * newStreak;

    const [updatedUser] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          coins: { increment: bonus },
          lastDailyBonus: now,
          streakCount: newStreak,
        },
      }),
      this.prisma.coinsLog.create({
        data: {
          userId,
          amount: bonus,
          reason: 'daily_bonus',
          metadata: { streak: newStreak },
        },
      }),
    ]);

    return {
      bonus,
      streak: newStreak,
      totalCoins: updatedUser.coins,
      message: `Daily bonus claimed! +${bonus} coins (${newStreak} day streak)`,
    };
  }

  async dailyCheckIn(userId: string): Promise<CheckInResponseDto> {
    const user = await this.findById(userId);

    if (user.isBanned) {
      throw new BadRequestException('Account is banned');
    }

    const now = new Date();
    const lastCheckIn = user.lastCheckIn;

    if (lastCheckIn) {
      const lastCheckInDate = new Date(lastCheckIn);
      const isSameDay =
        lastCheckInDate.getFullYear() === now.getFullYear() &&
        lastCheckInDate.getMonth() === now.getMonth() &&
        lastCheckInDate.getDate() === now.getDate();

      if (isSameDay) {
        throw new BadRequestException('Already checked in today. Come back tomorrow!');
      }
    }

    const isConsecutive =
      lastCheckIn &&
      (() => {
        const lastDate = new Date(lastCheckIn);
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        return (
          lastDate.getFullYear() === yesterday.getFullYear() &&
          lastDate.getMonth() === yesterday.getMonth() &&
          lastDate.getDate() === yesterday.getDate()
        );
      })();

    const newStreak = isConsecutive ? user.streakCount + 1 : 1;
    const xpEarned = 50 + newStreak * 10;
    const coinsEarned = 100 + newStreak * 20;
    const newTotalXp = user.xp + xpEarned;
    const newLevel = Math.floor(newTotalXp / 1000) + 1;

    const [updatedUser] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          xp: { increment: xpEarned },
          level: newLevel,
          coins: { increment: coinsEarned },
          lastCheckIn: now,
          streakCount: newStreak,
        },
      }),
      this.prisma.coinsLog.create({
        data: {
          userId,
          amount: coinsEarned,
          reason: 'daily_check_in',
          metadata: { streak: newStreak, xpEarned },
        },
      }),
    ]);

    return {
      xpEarned,
      coinsEarned,
      streak: newStreak,
      level: updatedUser.level,
      totalXp: updatedUser.xp,
      message: `Day ${newStreak} streak! Earned ${xpEarned} XP and ${coinsEarned} coins`,
    };
  }

  async banUser(id: string, reason: string) {
    const user = await this.findById(id);

    if (user.isBanned) {
      throw new ConflictException('User is already banned');
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        isBanned: true,
        banReason: reason,
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        isBanned: true,
        banReason: true,
      },
    });
  }

  async unbanUser(id: string) {
    const user = await this.findById(id);

    if (!user.isBanned) {
      throw new BadRequestException('User is not banned');
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        isBanned: false,
        banReason: null,
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        isBanned: true,
      },
    });
  }

  async muteUser(id: string, durationMinutes: number) {
    const user = await this.findById(id);

    if (user.isBanned) {
      throw new BadRequestException('Cannot mute a banned user');
    }

    if (user.isMuted && user.mutedUntil && user.mutedUntil > new Date()) {
      throw new ConflictException(
        `User is already muted until ${user.mutedUntil.toISOString()}`,
      );
    }

    const mutedUntil = new Date(Date.now() + durationMinutes * 60 * 1000);

    return this.prisma.user.update({
      where: { id },
      data: {
        isMuted: true,
        mutedUntil,
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        isMuted: true,
        mutedUntil: true,
      },
    });
  }

  async searchUsers(
    query: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (page - 1) * limit;

    const orConditions: any[] = [
      { username: { contains: query, mode: 'insensitive' as const } },
      { firstName: { contains: query, mode: 'insensitive' as const } },
      { lastName: { contains: query, mode: 'insensitive' as const } },
    ];

    const numericValue = Number(query);
    if (!isNaN(numericValue) && query.trim() !== '' && numericValue >= 0) {
      orConditions.push({ telegramId: { equals: BigInt(numericValue) } });
    }

    const where = { OR: orConditions };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { role: true },
      }),
      this.prisma.user.count({ where }),
    ]);

    const mappedUsers = users.map((user) => ({
      id: user.id,
      telegramId: String(user.telegramId),
      username: user.username ?? undefined,
      firstName: user.firstName ?? undefined,
      lastName: user.lastName ?? undefined,
      avatar: user.avatar ?? undefined,
      language: user.language,
      role: user.role?.name ?? 'user',
      xp: user.xp,
      level: user.level,
      coins: user.coins,
      isBanned: user.isBanned,
      isMuted: user.isMuted,
      createdAt: user.createdAt,
    }));

    return {
      data: mappedUsers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserStats(id: string): Promise<UserStatsDto> {
    const user = await this.findById(id);

    const [
      favoritesCount,
      watchHistoryCount,
      completedWatchCount,
      reviewsCount,
      watchTimeResult,
      achievementsCount,
      referralsCount,
      loginCount,
    ] = await Promise.all([
      this.prisma.favorite.count({ where: { userId: id } }),
      this.prisma.watchHistory.count({ where: { userId: id } }),
      this.prisma.watchHistory.count({ where: { userId: id, completed: true } }),
      this.prisma.review.count({ where: { userId: id } }),
      this.prisma.watchHistory.aggregate({
        where: { userId: id },
        _sum: { progress: true },
      }),
      this.prisma.userAchievement.count({ where: { userId: id } }),
      this.prisma.user.count({ where: { referredById: id } }),
      this.prisma.loginHistory.count({ where: { userId: id } }),
    ]);

    return {
      id: user.id,
      username: user.username ?? undefined,
      xp: user.xp,
      level: user.level,
      coins: user.coins,
      streakCount: user.streakCount,
      favoritesCount,
      watchHistoryCount,
      completedWatchCount,
      reviewsCount,
      totalWatchTimeMinutes: Math.floor(
        (watchTimeResult._sum.progress ?? 0) / 60,
      ),
      achievementsCount,
      referralsCount,
      loginCount,
      isBanned: user.isBanned,
      isMuted: user.isMuted,
      createdAt: user.createdAt,
    };
  }

  async getLoginHistory(userId: string, limit: number = 20) {
    await this.findById(userId);

    return this.prisma.loginHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        ip: true,
        device: true,
        platform: true,
        browser: true,
        createdAt: true,
      },
    });
  }

  private async checkAchievements(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    const achievements = await this.prisma.achievement.findMany({});

    for (const achievement of achievements) {
      const condition = achievement.condition as Record<string, unknown>;
      let isUnlocked = false;

      switch (condition.type) {
        case 'level': {
          const requiredLevel = Number(condition.value);
          isUnlocked = user.level >= requiredLevel;
          break;
        }
        case 'xp': {
          const requiredXp = Number(condition.value);
          isUnlocked = user.xp >= requiredXp;
          break;
        }
        case 'streak': {
          const requiredStreak = Number(condition.value);
          isUnlocked = user.streakCount >= requiredStreak;
          break;
        }
        case 'watch_count': {
          const count = await this.prisma.watchHistory.count({
            where: { userId },
          });
          isUnlocked = count >= Number(condition.value);
          break;
        }
        case 'favorites_count': {
          const count = await this.prisma.favorite.count({
            where: { userId },
          });
          isUnlocked = count >= Number(condition.value);
          break;
        }
        case 'reviews_count': {
          const count = await this.prisma.review.count({
            where: { userId },
          });
          isUnlocked = count >= Number(condition.value);
          break;
        }
        default:
          continue;
      }

      if (isUnlocked) {
        const existing = await this.prisma.userAchievement.findUnique({
          where: {
            userId_achievementId: {
              userId,
              achievementId: achievement.id,
            },
          },
        });

        if (!existing) {
          await this.prisma.userAchievement.create({
            data: {
              userId,
              achievementId: achievement.id,
            },
          });

          if (achievement.xpReward > 0) {
            await this.addXP(userId, achievement.xpReward);
          }

          if (achievement.coinReward > 0) {
            await this.addCoins(
              userId,
              achievement.coinReward,
              `achievement:${achievement.name}`,
            );
          }
        }
      }
    }
  }
}
