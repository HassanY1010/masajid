import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { CreateContributionDto, RejectContributionDto } from './dto/contribution.dto';
import { ContributionStatus, ProjectStatus, AuditAction } from '@masajid/shared-types';

@Injectable()
export class ContributionsService {
  private readonly logger = new Logger(ContributionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // Visitor: Submit new contribution
  async createContribution(
    dto: CreateContributionDto,
    receiptFile?: { url: string; storageKey: string },
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
    });

    if (!project || !project.isPublished) {
      throw new NotFoundException('المشروع غير متاح للمساهمة');
    }

    if (
      project.status === ProjectStatus.FULLY_FUNDED ||
      project.status === ProjectStatus.COMPLETED ||
      project.status === ProjectStatus.ARCHIVED
    ) {
      throw new BadRequestException('المشروع مكتمل التمويل أو غير متاح للمساهمات الجديدة');
    }

    // Share calculation & verification
    const shareValue = project.shareValue;
    const rawShares = dto.amount / shareValue;

    // Must be positive integer multiple of shareValue
    if (!Number.isInteger(rawShares) || rawShares <= 0) {
      throw new BadRequestException(
        `المبلغ (${dto.amount}) يجب أن يكون من مضاعفات قيمة السهم الواحد (${shareValue} ${project.currency})`,
      );
    }

    const calculatedShares = Math.round(rawShares);
    const remainingShares = project.totalShares - project.fundedShares;

    if (calculatedShares > remainingShares) {
      throw new BadRequestException(
        `عدد الأسهم المطلوبة (${calculatedShares}) يتجاوز الأسهم المتبقية للمشروع (${remainingShares} سهم)`,
      );
    }

    // Save contribution as PENDING (does not affect fundedShares until admin approves)
    const contribution = await this.prisma.contribution.create({
      data: {
        projectId: dto.projectId,
        amount: dto.amount,
        currency: dto.currency || project.currency,
        shares: calculatedShares,
        donorName: dto.donorName || 'فاعل خير',
        donorPhone: dto.donorPhone,
        paymentMethod: dto.paymentMethod,
        receiptUrl: receiptFile?.url || null,
        receiptStorageKey: receiptFile?.storageKey || null,
        status: ContributionStatus.PENDING,
      },
      include: {
        project: {
          select: { id: true, title: true, mosqueName: true },
        },
      },
    });

    this.logger.log(
      `📥 New pending contribution submitted: id=${contribution.id}, project=${project.title}, amount=${dto.amount} ${project.currency}, shares=${calculatedShares}`,
    );

    return contribution;
  }

  // Admin: Get all contributions with filtering
  async getAdminContributions(query: {
    status?: ContributionStatus;
    projectId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.projectId) where.projectId = query.projectId;

    const [items, total] = await Promise.all([
      this.prisma.contribution.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              title: true,
              mosqueName: true,
              governorate: true,
              shareValue: true,
              totalShares: true,
              fundedShares: true,
              estimatedCost: true,
              fundedAmount: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.contribution.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Admin: Get single contribution
  async getContributionById(id: string) {
    const contribution = await this.prisma.contribution.findUnique({
      where: { id },
      include: {
        project: true,
      },
    });

    if (!contribution) {
      throw new NotFoundException('المساهمة غير موجودة');
    }

    return contribution;
  }

  // Admin: Approve contribution with atomic transaction & row locking to prevent race conditions & double approval
  async approveContribution(id: string, adminId?: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Fetch contribution
      const contribution = await tx.contribution.findUnique({
        where: { id },
        include: { project: true },
      });

      if (!contribution) {
        throw new NotFoundException('المساهمة غير موجودة');
      }

      // Check Idempotency / Double Approval
      if (contribution.status === ContributionStatus.APPROVED) {
        throw new ConflictException('تمت الموافقة على هذه المساهمة مسبقاً');
      }

      if (contribution.status === ContributionStatus.REJECTED) {
        throw new BadRequestException('لا يمكن قبول مساهمة تم رفضها سابقاً');
      }

      // 2. Fetch latest project data with row check
      const project = await tx.project.findUnique({
        where: { id: contribution.projectId },
      });

      if (!project) {
        throw new NotFoundException('مشروع المسجد غير موجود');
      }

      const availableShares = project.totalShares - project.fundedShares;

      // Prevent Overfunding
      if (contribution.shares > availableShares) {
        throw new BadRequestException(
          `لا يمكن قبول المساهمة لأن عدد أسهمها (${contribution.shares}) يتجاوز الأسهم المتبقية للمشروع (${availableShares})`,
        );
      }

      // 3. Increment funded amounts & check if fully funded
      const newFundedShares = project.fundedShares + contribution.shares;
      const newFundedAmount = project.fundedAmount + contribution.amount;
      const isFullyFunded = newFundedShares >= project.totalShares;

      await tx.project.update({
        where: { id: project.id },
        data: {
          fundedShares: newFundedShares,
          fundedAmount: newFundedAmount,
          status: isFullyFunded ? ProjectStatus.FULLY_FUNDED : project.status,
        },
      });

      // 4. Update contribution status to APPROVED
      const updatedContribution = await tx.contribution.update({
        where: { id },
        data: {
          status: ContributionStatus.APPROVED,
          approvedAt: new Date(),
        },
        include: {
          project: true,
        },
      });

      // 5. Audit Log
      await this.auditService.log({
        adminId,
        action: AuditAction.ADMIN_APPROVED_CONTRIBUTION,
        entity: 'Contribution',
        entityId: id,
        metadata: {
          projectId: project.id,
          amount: contribution.amount,
          shares: contribution.shares,
          newFundedShares,
          isFullyFunded,
        },
      });

      this.logger.log(
        `✅ Contribution ${id} APPROVED by admin ${adminId}. Project ${project.id} is now at ${newFundedShares}/${project.totalShares} shares.`,
      );

      return updatedContribution;
    });
  }

  // Admin: Reject contribution
  async rejectContribution(id: string, dto: RejectContributionDto, adminId?: string) {
    const contribution = await this.prisma.contribution.findUnique({
      where: { id },
    });

    if (!contribution) {
      throw new NotFoundException('المساهمة غير موجودة');
    }

    if (contribution.status === ContributionStatus.APPROVED) {
      throw new BadRequestException('لا يمكن رفض مساهمة تم قبولها واحتساب أسهمها بالفعل');
    }

    const updated = await this.prisma.contribution.update({
      where: { id },
      data: {
        status: ContributionStatus.REJECTED,
        rejectionReason: dto.reason,
      },
      include: {
        project: true,
      },
    });

    await this.auditService.log({
      adminId,
      action: AuditAction.ADMIN_REJECTED_CONTRIBUTION,
      entity: 'Contribution',
      entityId: id,
      metadata: { reason: dto.reason },
    });

    this.logger.warn(`❌ Contribution ${id} REJECTED by admin ${adminId}. Reason: ${dto.reason}`);

    return updated;
  }
}
