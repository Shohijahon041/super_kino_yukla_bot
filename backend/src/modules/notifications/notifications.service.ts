import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service';
import { RedisService } from '../../config/redis.service';
import { PaginationDto, PaginatedResponse } from '../../common/dto/pagination.dto';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getUserNotifications(
    userId: string,
    dto: PaginationDto,
  ): Promise<PaginatedResponse<any>> {
    const where: Prisma.NotificationWhereInput = { userId };

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip: dto.skip,
        take: dto.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return new PaginatedResponse(data, total, dto.page, dto.limit);
  }

  async getUnreadCount(userId: string): Promise<number> {
    const cacheKey = `notifications:unread:${userId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached !== null) {
      return Number(cached);
    }

    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });

    await this.redis.set(cacheKey, String(count), 300);
    return count;
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    await this.redis.del(`notifications:unread:${userId}`);

    return updated;
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    await this.redis.del(`notifications:unread:${userId}`);

    return { updated: result.count };
  }

  async sendNotification(
    userId: string,
    data: {
      type: string;
      title: string;
      body?: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type: data.type,
        title: data.title,
        body: data.body ?? null,
        data: (data.metadata as any) ?? Prisma.JsonNull,
      },
    });

    await this.redis.del(`notifications:unread:${userId}`);

    return notification;
  }

  async broadcastNotification(data: {
    type: string;
    title: string;
    body?: string;
    metadata?: Record<string, unknown>;
    target?: 'all' | 'premium' | 'free';
  }) {
    const where: Prisma.UserWhereInput = { isActive: true, isBanned: false };

    if (data.target === 'premium') {
      where.isPremium = true;
    } else if (data.target === 'free') {
      where.isPremium = false;
    }

    const users = await this.prisma.user.findMany({
      where,
      select: { id: true },
    });

    if (users.length === 0) {
      return { sent: 0, failed: 0 };
    }

    const notificationData = users.map((user) => ({
      userId: user.id,
      type: data.type,
      title: data.title,
      body: data.body ?? null,
      data: (data.metadata as any) ?? Prisma.JsonNull,
    }));

    const batchSize = 500;
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < notificationData.length; i += batchSize) {
      const batch = notificationData.slice(i, i + batchSize);
      try {
        await this.prisma.notification.createMany({ data: batch });
        sent += batch.length;
      } catch {
        failed += batch.length;
      }
    }

    for (const user of users) {
      await this.redis.del(`notifications:unread:${user.id}`);
    }

    return { sent, failed, total: users.length };
  }

  async deleteNotification(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.notification.delete({ where: { id: notificationId } });
    await this.redis.del(`notifications:unread:${userId}`);

    return { deleted: true };
  }
}
