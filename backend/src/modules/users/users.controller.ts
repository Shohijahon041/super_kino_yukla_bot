import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query as QueryParam,
  DefaultValuePipe,
  ParseIntPipe,
  ParseBoolPipe,
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
import { UsersService } from './users.service';
import {
  UpdateUserDto,
  UpdateLanguageDto,
  BanUserDto,
  MuteUserDto,
} from './dto/users.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/guards/roles.guard';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile/:id')
  @ApiOperation({
    summary: 'Get public user profile',
    description: 'Returns the public profile of a user by ID including stats and achievements.',
  })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        telegramId: { type: 'string' },
        username: { type: 'string', nullable: true },
        firstName: { type: 'string', nullable: true },
        avatar: { type: 'string', nullable: true },
        level: { type: 'number' },
        xp: { type: 'number' },
        favoritesCount: { type: 'number' },
        achievements: { type: 'array' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getPublicProfile(@Param('id') id: string) {
    return this.usersService.getProfile(id);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Returns the full profile of the authenticated user including stats and achievements.',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getMyProfile(@CurrentUser('id') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Put('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update current user profile',
    description: 'Update username, name, avatar, or bio of the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Username already taken' })
  async updateMyProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(userId, dto);
  }

  @Put('me/language')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update language preference',
    description: 'Change the preferred language for the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Language updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        language: { type: 'string', example: 'uz' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateLanguage(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateLanguageDto,
  ) {
    return this.usersService.updateLanguage(userId, dto.language);
  }

  @Post('me/daily-bonus')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Claim daily bonus',
    description:
      'Claim daily bonus coins. Bonus = 100 × streak. Streak resets if not claimed consecutively.',
  })
  @ApiResponse({
    status: 200,
    description: 'Daily bonus claimed successfully',
    schema: {
      type: 'object',
      properties: {
        bonus: { type: 'number', example: 500 },
        streak: { type: 'number', example: 5 },
        totalCoins: { type: 'number', example: 1500 },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bonus already claimed or account banned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async claimDailyBonus(@CurrentUser('id') userId: string) {
    return this.usersService.checkDailyBonus(userId);
  }

  @Post('me/check-in')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Daily check-in',
    description:
      'Perform daily check-in to earn XP and coins. Streak bonus increases rewards.',
  })
  @ApiResponse({
    status: 200,
    description: 'Check-in successful',
    schema: {
      type: 'object',
      properties: {
        xpEarned: { type: 'number', example: 80 },
        coinsEarned: { type: 'number', example: 160 },
        streak: { type: 'number', example: 3 },
        level: { type: 'number', example: 5 },
        totalXp: { type: 'number', example: 4500 },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Already checked in today or account banned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async dailyCheckIn(@CurrentUser('id') userId: string) {
    return this.usersService.dailyCheckIn(userId);
  }

  @Get('leaderboard')
  @ApiOperation({
    summary: 'Get XP leaderboard',
    description: 'Returns the top users ranked by XP and level.',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of entries (max 100)', example: 50 })
  @ApiResponse({
    status: 200,
    description: 'Leaderboard retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          rank: { type: 'number' },
          id: { type: 'string' },
          username: { type: 'string', nullable: true },
          xp: { type: 'number' },
          level: { type: 'number' },
          coins: { type: 'number' },
          streakCount: { type: 'number' },
        },
      },
    },
  })
  async getLeaderboard(
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    return this.usersService.getLeaderboard(safeLimit);
  }

  @Get('me/login-history')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get login history',
    description: 'Returns recent login history for the authenticated user.',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max entries to return', example: 20 })
  @ApiResponse({
    status: 200,
    description: 'Login history retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getLoginHistory(
    @CurrentUser('id') userId: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    return this.usersService.getLoginHistory(userId, safeLimit);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List all users (admin)',
    description: 'Search and list all users with filtering. Requires admin role.',
  })
  @ApiQuery({ name: 'query', required: false, type: String, description: 'Search query' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page', example: 20 })
  @ApiResponse({
    status: 200,
    description: 'Users listed successfully',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array' },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  async listUsers(
    @Query('query', new DefaultValuePipe('')) query: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const safePage = Math.max(page, 1);
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    return this.usersService.searchUsers(query, safePage, safeLimit);
  }

  @Get(':id/stats')
  @UseGuards(AuthGuard('jwt'))
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user stats (admin)',
    description: 'Retrieve detailed statistics for a specific user. Requires admin role.',
  })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({
    status: 200,
    description: 'User stats retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserStats(@Param('id') id: string) {
    return this.usersService.getUserStats(id);
  }

  @Put(':id/ban')
  @UseGuards(AuthGuard('jwt'))
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ban user (admin)',
    description: 'Ban a user account with a reason. Requires admin role.',
  })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({
    status: 200,
    description: 'User banned successfully',
  })
  @ApiResponse({ status: 400, description: 'User is already banned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async banUser(
    @Param('id') id: string,
    @Body() dto: BanUserDto,
  ) {
    return this.usersService.banUser(id, dto.reason);
  }

  @Put(':id/unban')
  @UseGuards(AuthGuard('jwt'))
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Unban user (admin)',
    description: 'Remove a ban from a user account. Requires admin role.',
  })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({
    status: 200,
    description: 'User unbanned successfully',
  })
  @ApiResponse({ status: 400, description: 'User is not banned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async unbanUser(@Param('id') id: string) {
    return this.usersService.unbanUser(id);
  }

  @Put(':id/mute')
  @UseGuards(AuthGuard('jwt'))
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mute user (admin)',
    description: 'Mute a user for a specified duration in minutes. Requires admin role.',
  })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({
    status: 200,
    description: 'User muted successfully',
  })
  @ApiResponse({ status: 400, description: 'User is banned or already muted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'User is currently muted' })
  async muteUser(
    @Param('id') id: string,
    @Body() dto: MuteUserDto,
  ) {
    return this.usersService.muteUser(id, dto.duration);
  }
}
