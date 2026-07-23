import {
  Controller,
  Get,
  Post,
  Body,
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
} from '@nestjs/swagger';
import { GamificationService } from './gamification.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { SpendCoinsDto } from './dto/gamification.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Gamification')
@Controller('gamification')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get('missions')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get missions with user progress' })
  @ApiResponse({ status: 200, description: 'Missions retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMissions(@CurrentUser('id') userId: string) {
    return this.gamificationService.getMissions(userId);
  }

  @Post('missions/:id/claim')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Claim completed mission reward' })
  @ApiParam({ name: 'id', description: 'Mission UUID' })
  @ApiResponse({ status: 200, description: 'Reward claimed' })
  @ApiResponse({ status: 400, description: 'Mission not completed or already claimed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Mission not found' })
  async claimMissionReward(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.gamificationService.claimMissionReward(userId, id);
  }

  @Get('achievements')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all achievements with unlock status' })
  @ApiResponse({ status: 200, description: 'Achievements retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAllAchievements(@CurrentUser('id') userId: string) {
    return this.gamificationService.getAllAchievements(userId);
  }

  @Get('achievements/unlocked')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user unlocked achievements' })
  @ApiResponse({ status: 200, description: 'Unlocked achievements retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUnlockedAchievements(@CurrentUser('id') userId: string) {
    return this.gamificationService.getAchievements(userId);
  }

  @Post('spin')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Spin the daily wheel' })
  @ApiResponse({ status: 200, description: 'Spin result' })
  @ApiResponse({ status: 400, description: 'No spins remaining' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async spinWheel(@CurrentUser('id') userId: string) {
    return this.gamificationService.getSpinWheelResult(userId);
  }

  @Get('coins/history')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get coins transaction history' })
  @ApiResponse({ status: 200, description: 'Coins history retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCoinsHistory(
    @CurrentUser('id') userId: string,
    @Query() dto: PaginationDto,
  ) {
    return this.gamificationService.getCoinsHistory(userId, dto);
  }

  @Post('coins/spend')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Spend coins' })
  @ApiResponse({ status: 200, description: 'Coins spent' })
  @ApiResponse({ status: 400, description: 'Insufficient coins' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async spendCoins(
    @CurrentUser('id') userId: string,
    @Body() dto: SpendCoinsDto,
  ) {
    return this.gamificationService.spendCoins(userId, dto);
  }
}
