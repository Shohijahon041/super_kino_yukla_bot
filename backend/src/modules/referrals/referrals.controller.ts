import {
  Controller,
  Get,
  Post,
  Param,
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
  ApiQuery,
} from '@nestjs/swagger';
import { ReferralsService } from './referrals.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Referrals')
@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Get('code')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get referral code and link' })
  @ApiResponse({ status: 200, description: 'Referral code retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getReferralCode(@CurrentUser('id') userId: string) {
    return this.referralsService.getReferralCode(userId);
  }

  @Post('apply/:code')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Apply referral code' })
  @ApiParam({ name: 'code', description: 'Referral code' })
  @ApiResponse({ status: 200, description: 'Referral applied successfully' })
  @ApiResponse({ status: 400, description: 'Cannot refer yourself' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Invalid referral code' })
  @ApiResponse({ status: 409, description: 'Already referred' })
  async applyReferralCode(
    @CurrentUser('id') userId: string,
    @Param('code') code: string,
  ) {
    return this.referralsService.processReferral(userId, code);
  }

  @Get('stats')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get referral statistics' })
  @ApiResponse({ status: 200, description: 'Stats retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getReferralStats(@CurrentUser('id') userId: string) {
    return this.referralsService.getReferralStats(userId);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get referral leaderboard' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Leaderboard retrieved' })
  async getReferralLeaderboard(@Query('limit') limit?: number) {
    return this.referralsService.getReferralLeaderboard(limit ?? 50);
  }

  @Get('list')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get list of referred users' })
  @ApiResponse({ status: 200, description: 'Referred users retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getReferredUsers(
    @CurrentUser('id') userId: string,
    @Query() dto: PaginationDto,
  ) {
    return this.referralsService.getReferredUsers(userId, dto);
  }
}
