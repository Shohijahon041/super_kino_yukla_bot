import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Full health check',
    description: 'Returns comprehensive health status including database, Redis, disk, and memory checks.',
  })
  @ApiResponse({ status: 200, description: 'Health check complete' })
  async check() {
    return this.healthService.getOverallHealth();
  }

  @Get('ready')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Readiness probe',
    description: 'Returns whether the service is ready to accept traffic. Checks critical dependencies (DB, Redis).',
  })
  @ApiResponse({ status: 200, description: 'Readiness check complete' })
  async readiness() {
    return this.healthService.getReadiness();
  }

  @Get('live')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Liveness probe',
    description: 'Returns whether the service process is alive and running.',
  })
  @ApiResponse({ status: 200, description: 'Liveness check complete' })
  async liveness() {
    return this.healthService.getLiveness();
  }
}
