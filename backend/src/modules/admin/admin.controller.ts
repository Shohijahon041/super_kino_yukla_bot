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
import { AdminService } from './admin.service';
import { Roles } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  BroadcastDto,
  GetBroadcastHistoryDto,
  BulkImportDto,
  BulkExportDto,
  GetAdminActionsDto,
  AnalyticsPeriodDto,
} from './dto/admin.dto';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(AuthGuard('jwt'))
@Roles('admin')
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({
    summary: 'Get dashboard statistics',
    description:
      'Returns comprehensive dashboard stats including user counts, movie counts, views, top genres, and top countries.',
  })
  @ApiResponse({ status: 200, description: 'Dashboard stats retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('analytics')
  @ApiOperation({
    summary: 'Get analytics data',
    description:
      'Returns analytics data for a specified period including new users, views, searches, and top content.',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['day', 'week', 'month'],
    description: 'Analytics period',
    default: 'week',
  })
  @ApiResponse({ status: 200, description: 'Analytics data retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  async getAnalytics(@Query() dto: AnalyticsPeriodDto) {
    return this.adminService.getAnalytics(dto);
  }

  @Get('system-health')
  @ApiOperation({
    summary: 'Get system health',
    description:
      'Returns system health status including database connectivity, Redis, memory usage, and uptime.',
  })
  @ApiResponse({ status: 200, description: 'System health retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  async getSystemHealth() {
    return this.adminService.getSystemHealth();
  }

  @Get('server-stats')
  @ApiOperation({
    summary: 'Get server statistics',
    description:
      'Returns detailed server stats including user/movie/series counts, engagement metrics, and recent admin actions.',
  })
  @ApiResponse({ status: 200, description: 'Server stats retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  async getServerStats() {
    return this.adminService.getServerStats();
  }

  @Post('broadcast')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Broadcast a message',
    description:
      'Send a broadcast notification to all users, premium users, or specific user IDs.',
  })
  @ApiResponse({ status: 201, description: 'Broadcast sent successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  async broadcastMessage(
    @CurrentUser('id') adminId: string,
    @Body() dto: BroadcastDto,
  ) {
    return this.adminService.broadcastMessage(dto, adminId);
  }

  @Get('broadcasts')
  @ApiOperation({
    summary: 'Get broadcast history',
    description: 'Returns a paginated list of all past broadcasts.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'Broadcast history retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  async getBroadcastHistory(@Query() dto: GetBroadcastHistoryDto) {
    return this.adminService.getBroadcastHistory(dto);
  }

  @Post('import')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Bulk import movies',
    description:
      'Import multiple movies at once. Returns import results with success/failure counts and any errors.',
  })
  @ApiResponse({ status: 201, description: 'Import completed' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  async bulkImportMovies(
    @CurrentUser('id') adminId: string,
    @Body() dto: BulkImportDto,
  ) {
    return this.adminService.bulkImportMovies(dto.movies, adminId);
  }

  @Post('export')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Bulk export movies',
    description:
      'Export all movies as JSON with full details including genres, countries, languages, actors, and tags.',
  })
  @ApiResponse({ status: 200, description: 'Export completed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  async bulkExportMovies(@Body() dto: BulkExportDto) {
    return this.adminService.bulkExportMovies(dto.includeInactive);
  }

  @Get('actions')
  @ApiOperation({
    summary: 'Get admin action log',
    description:
      'Returns a paginated list of all admin actions with optional filters for admin, action type, and target type.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'adminId', required: false, type: String, description: 'Filter by admin ID' })
  @ApiQuery({ name: 'action', required: false, type: String, description: 'Filter by action type' })
  @ApiQuery({ name: 'targetType', required: false, type: String, description: 'Filter by target type' })
  @ApiResponse({ status: 200, description: 'Admin actions retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  async getAdminActions(@Query() dto: GetAdminActionsDto) {
    return this.adminService.getAdminActions(dto);
  }

  @Post('movies/:id/feature')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Feature a movie',
    description: 'Mark a movie as featured. Featured movies are displayed prominently on the platform.',
  })
  @ApiParam({ name: 'id', description: 'Movie UUID' })
  @ApiResponse({ status: 200, description: 'Movie featured successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  @ApiResponse({ status: 409, description: 'Movie is already featured' })
  async featureMovie(
    @CurrentUser('id') adminId: string,
    @Param('id') id: string,
  ) {
    return this.adminService.featureMovie(id, adminId);
  }

  @Post('movies/:id/unfeature')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Unfeature a movie',
    description: 'Remove a movie from featured status.',
  })
  @ApiParam({ name: 'id', description: 'Movie UUID' })
  @ApiResponse({ status: 200, description: 'Movie unfeatured successfully' })
  @ApiResponse({ status: 400, description: 'Movie is not featured' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  async unfeatureMovie(
    @CurrentUser('id') adminId: string,
    @Param('id') id: string,
  ) {
    return this.adminService.unfeatureMovie(id, adminId);
  }
}
