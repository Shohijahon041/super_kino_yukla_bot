import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service';
import { RedisService } from '../../config/redis.service';

@Injectable()
export class SubscriptionsService {
  private readonly PLAN_DURATIONS: Record<string, number> = {
    monthly: 30,
    yearly: 365,
    lifetime: 36500,
  };

  private readonly PLAN_PRICES: Record<string, number> = {
    monthly: 29900,
    yearly: 249900,
    lifetime: 499900,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async createSubscription(
    userId: string,
    data: {
      plan: string;
      paymentId?: string;
      autoRenew?: boolean;
    },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!this.PLAN_DURATIONS[data.plan]) {
      throw new BadRequestException('Invalid plan. Choose: monthly, yearly, or lifetime');
    }

    const activeSubscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: 'active',
        endDate: { gt: new Date() },
      },
    });

    if (activeSubscription) {
      throw new ConflictException(
        'You already have an active subscription. Cancel it first or wait for it to expire.',
      );
    }

    const durationDays = this.PLAN_DURATIONS[data.plan];
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + durationDays);

    const subscription = await this.prisma.subscription.create({
      data: {
        userId,
        plan: data.plan,
        status: 'active',
        startDate,
        endDate,
        autoRenew: data.autoRenew ?? false,
        paymentId: data.paymentId ?? null,
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isPremium: true,
        premiumUntil: endDate,
      },
    });

    await this.redis.del(`user:${userId}:premium`);

    return subscription;
  }

  async getActiveSubscription(userId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: 'active',
        endDate: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      return null;
    }

    const now = new Date();
    const endDate = new Date(subscription.endDate!);
    const daysRemaining = Math.ceil(
      (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    return {
      ...subscription,
      daysRemaining,
      price: this.PLAN_PRICES[subscription.plan] ?? 0,
    };
  }

  async cancelSubscription(userId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: 'active',
        endDate: { gt: new Date() },
      },
    });

    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    const updated = await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'cancelled',
        autoRenew: false,
      },
    });

    const hasOtherActive = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: 'active',
        id: { not: subscription.id },
        endDate: { gt: new Date() },
      },
    });

    if (!hasOtherActive) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          isPremium: false,
          premiumUntil: null,
        },
      });
    }

    await this.redis.del(`user:${userId}:premium`);

    return updated;
  }

  async checkPremium(userId: string): Promise<{
    isPremium: boolean;
    plan?: string;
    endDate?: Date;
    daysRemaining?: number;
  }> {
    const cacheKey = `user:${userId}:premium`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const subscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: 'active',
        endDate: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = subscription
      ? {
          isPremium: true,
          plan: subscription.plan,
          endDate: subscription.endDate!,
          daysRemaining: Math.ceil(
            (new Date(subscription.endDate!).getTime() - Date.now()) /
              (1000 * 60 * 60 * 24),
          ),
        }
      : { isPremium: false };

    await this.redis.set(cacheKey, JSON.stringify(result), 300);

    return result;
  }

  async getSubscriptionHistory(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const where: Prisma.SubscriptionWhereInput = { userId };

    const [data, total] = await Promise.all([
      this.prisma.subscription.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.subscription.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async extendSubscription(
    userId: string,
    subscriptionId: string,
    months: number,
  ) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.userId !== userId) {
      throw new NotFoundException('Subscription not found');
    }

    const currentEndDate =
      subscription.status === 'active' && subscription.endDate
        ? new Date(subscription.endDate)
        : new Date();

    const newEndDate = new Date(currentEndDate);
    newEndDate.setMonth(newEndDate.getMonth() + months);

    const updated = await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        endDate: newEndDate,
        status: 'active',
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isPremium: true,
        premiumUntil: newEndDate,
      },
    });

    await this.redis.del(`user:${userId}:premium`);

    return updated;
  }
}
