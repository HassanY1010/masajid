import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'فحص جاهزية وحالة الخادم (Health Check)' })
  check() {
    return {
      status: 'ok',
      service: 'masajid-api',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
