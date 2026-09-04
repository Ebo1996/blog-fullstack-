import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Basic health check' })
  async check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    };
  }

  @Public()
  @Get('detailed')
  @ApiOperation({ summary: 'Detailed health check with dependencies' })
  async detailed() {
    return this.healthService.getDetailedHealth();
  }

  @Public()
  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe for container orchestration' })
  async ready() {
    const health = await this.healthService.checkReadiness();
    
    if (!health.ready) {
      throw new Error('Service not ready');
    }
    
    return health;
  }

  @Public()
  @Get('live')
  @ApiOperation({ summary: 'Liveness probe for container orchestration' })
  liveness() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }
}
