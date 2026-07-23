import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service';
import { PaginationDto, PaginatedResponse } from '../../common/dto/pagination.dto';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  async createPayment(
    userId: string,
    data: {
      amount: number;
      currency?: string;
      provider: string;
      plan?: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (data.amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    const payment = await this.prisma.payment.create({
      data: {
        userId,
        amount: data.amount,
        currency: data.currency ?? 'UZS',
        provider: data.provider,
        status: 'pending',
        metadata: {
          ...(data.metadata ?? {}),
          ...(data.plan ? { plan: data.plan } : {}),
        },
      },
    });

    return {
      ...payment,
      paymentUrl: this.generatePaymentUrl(payment),
    };
  }

  async processPaymentCallback(
    provider: string,
    callbackData: {
      transactionId?: string;
      status?: string;
      signature?: string;
      data?: Record<string, unknown>;
    },
  ) {
    const externalId =
      callbackData.transactionId ?? callbackData.data?.transaction_id as string;

    if (!externalId) {
      throw new BadRequestException('Missing transaction ID in callback');
    }

    const payment = await this.prisma.payment.findFirst({
      where: { externalId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found for this transaction');
    }

    if (payment.status === 'completed') {
      return { alreadyProcessed: true, payment };
    }

    const callbackStatus = this.mapProviderStatus(provider, callbackData.status);

    if (callbackStatus === 'completed') {
      const [updatedPayment] = await this.prisma.$transaction([
        this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'completed',
            externalId,
          },
        }),
        this.prisma.coinsLog.create({
          data: {
            userId: payment.userId,
            amount: Math.floor(payment.amount / 100),
            reason: 'payment_purchase',
            metadata: { paymentId: payment.id, provider },
          },
        }),
      ]);

      const metadata = payment.metadata as Record<string, unknown>;
      const plan = metadata?.plan as string | undefined;
      if (plan) {
        await this.subscriptionsService.createSubscription(payment.userId, {
          plan,
          paymentId: payment.id,
        });
      }

      return { alreadyProcessed: false, payment: updatedPayment };
    }

    if (callbackStatus === 'failed') {
      const updatedPayment = await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'failed' },
      });

      return { alreadyProcessed: false, payment: updatedPayment };
    }

    return { alreadyProcessed: false, payment };
  }

  async getPaymentHistory(
    userId: string,
    dto: PaginationDto,
  ): Promise<PaginatedResponse<any>> {
    const where: Prisma.PaymentWhereInput = { userId };

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip: dto.skip,
        take: dto.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return new PaginatedResponse(data, total, dto.page, dto.limit);
  }

  async getPaymentById(userId: string, paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.userId !== userId) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async refundPayment(
    paymentId: string,
    reason?: string,
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== 'completed') {
      throw new BadRequestException(
        `Cannot refund a payment with status "${payment.status}"`,
      );
    }

    const refundAmount = -payment.amount;

    const [updatedPayment] = await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'refunded',
          metadata: {
            ...((payment.metadata as Record<string, unknown>) ?? {}),
            refundReason: reason ?? null,
            refundedAt: new Date().toISOString(),
          },
        },
      }),
      this.prisma.coinsLog.create({
        data: {
          userId: payment.userId,
          amount: refundAmount,
          reason: 'payment_refund',
          metadata: { paymentId, provider: payment.provider, reason },
        },
      }),
    ]);

    const metadata = payment.metadata as Record<string, unknown>;
    const plan = metadata?.plan as string | undefined;
    if (plan) {
      await this.subscriptionsService.cancelSubscription(payment.userId);
    }

    return updatedPayment;
  }

  private generatePaymentUrl(payment: { id: string; amount: number; provider: string }): string {
    const baseUrl = process.env.PAYMENT_BASE_URL ?? 'https://payment.cinemahub.ai';
    return `${baseUrl}/${payment.provider}?id=${payment.id}&amount=${payment.amount}`;
  }

  private mapProviderStatus(
    provider: string,
    rawStatus?: string,
  ): 'pending' | 'completed' | 'failed' {
    if (!rawStatus) return 'pending';

    const normalized = rawStatus.toLowerCase();

    switch (provider) {
      case 'payme':
        if (normalized === 'success' || normalized === 'paid') return 'completed';
        if (normalized === 'cancelled' || normalized === 'failed') return 'failed';
        return 'pending';

      case 'click':
        if (normalized === 'success' || normalized === '0') return 'completed';
        if (normalized === 'error' || normalized === '-1') return 'failed';
        return 'pending';

      case 'stripe':
        if (normalized === 'succeeded') return 'completed';
        if (normalized === 'failed' || normalized === 'canceled') return 'failed';
        return 'pending';

      case 'uzum':
        if (normalized === 'success' || normalized === 'paid') return 'completed';
        if (normalized === 'cancelled' || normalized === 'failed') return 'failed';
        return 'pending';

      default:
        return 'pending';
    }
  }
}
