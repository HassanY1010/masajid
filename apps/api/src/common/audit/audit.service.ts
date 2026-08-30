import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction } from '@masajid/shared-types';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    adminId?: string;
    action: AuditAction;
    entity: string;
    entityId?: string;
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      this.logger.log(`AUDIT [${params.action}] entity=${params.entity} entityId=${params.entityId || 'N/A'}`);
      await this.prisma.auditLog.create({
        data: {
          adminId: params.adminId,
          action: params.action as any,
          entity: params.entity,
          entityId: params.entityId,
          metadata: params.metadata || {},
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      });
    } catch (e) {
      this.logger.error(`Failed to write audit log: ${e.message}`);
    }
  }
}
