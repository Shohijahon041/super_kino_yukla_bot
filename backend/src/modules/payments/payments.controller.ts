import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  CreatePaymentDto,
  PaymentCallbackDto,
  RefundPaymentDto,
} from './dto/payments.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a payment' })
  @ApiResponse({ status: 201, description: 'Payment created' })
  @ApiResponse({ status: 400, description: 'Invalid amount' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async createPayment(
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentsService.createPayment(userId, {
      amount: dto.amount,
      currency: dto.currency,
      provider: dto.provider,
      plan: dto.plan,
      metadata: dto.metadata,
    });
  }

  @Post('callback/:provider')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process payment callback from provider' })
  @ApiParam({ name: 'provider', description: 'Payment provider name', enum: ['payme', 'click', 'stripe', 'uzum'] })
  @ApiResponse({ status: 200, description: 'Callback processed' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async processCallback(
    @Param('provider') provider: string,
    @Body() dto: PaymentCallbackDto,
  ) {
    return this.paymentsService.processPaymentCallback(provider, {
      transactionId: dto.transactionId,
      status: dto.status,
      signature: dto.signature,
      data: dto.data,
    });
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment history' })
  @ApiResponse({ status: 200, description: 'Payments retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPaymentHistory(
    @CurrentUser('id') userId: string,
    @Query() dto: PaginationDto,
  ) {
    return this.paymentsService.getPaymentHistory(userId, dto);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiParam({ name: 'id', description: 'Payment UUID' })
  @ApiResponse({ status: 200, description: 'Payment retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async getPaymentById(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.paymentsService.getPaymentById(userId, id);
  }

  @Post(':id/refund')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refund payment (admin)' })
  @ApiParam({ name: 'id', description: 'Payment UUID' })
  @ApiResponse({ status: 200, description: 'Payment refunded' })
  @ApiResponse({ status: 400, description: 'Payment cannot be refunded' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async refundPayment(
    @Param('id') id: string,
    @Body() dto: RefundPaymentDto,
  ) {
    return this.paymentsService.refundPayment(id, dto.reason);
  }
}
