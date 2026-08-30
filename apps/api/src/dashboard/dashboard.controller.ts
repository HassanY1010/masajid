import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Admin Dashboard')
@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'لوحة التحكم: جلب الإحصائيات العامة للمنصة والمشاريع' })
  async getDashboardStats() {
    return this.dashboardService.getStats();
  }
}
