import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { AuditAction } from '@masajid/shared-types';

@ApiTags('Admin Audit Logs')
@Controller('admin/audit-logs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AuditLogsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'لوحة التحكم: استعراض سجل الرقابة والعمليات الإدارية' })
  @ApiQuery({ name: 'action', enum: AuditAction, required: false })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  async getLogs(
    @Query('action') action?: AuditAction,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.max(1, Math.min(100, Number(limit) || 25));
    const skip = (p - 1) * l;

    const where: any = {};
    if (action) where.action = action;

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          admin: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: l,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items,
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l),
    };
  }
}
