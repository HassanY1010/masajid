import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContributionStatus, ProjectStatus } from '@masajid/shared-types';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [
      totalProjects,
      publishedProjects,
      fundingProjects,
      completedProjects,
      pendingContributions,
      approvedContributions,
      financialAggregates,
      recentContributions,
      recentProjects,
    ] = await Promise.all([
      this.prisma.project.count(),
      this.prisma.project.count({ where: { isPublished: true } }),
      this.prisma.project.count({ where: { isPublished: true, status: ProjectStatus.FUNDING } }),
      this.prisma.project.count({ where: { status: { in: [ProjectStatus.FULLY_FUNDED, ProjectStatus.COMPLETED] } } }),
      this.prisma.contribution.count({ where: { status: ContributionStatus.PENDING } }),
      this.prisma.contribution.count({ where: { status: ContributionStatus.APPROVED } }),
      this.prisma.contribution.aggregate({
        where: { status: ContributionStatus.APPROVED },
        _sum: {
          amount: true,
          shares: true,
        },
      }),
      this.prisma.contribution.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          project: { select: { id: true, title: true, mosqueName: true } },
        },
      }),
      this.prisma.project.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          images: { take: 1, orderBy: { sortOrder: 'asc' } },
        },
      }),
    ]);

    return {
      totalProjects,
      publishedProjects,
      fundingProjects,
      completedProjects,
      pendingContributions,
      approvedContributions,
      totalFundedAmount: financialAggregates._sum.amount || 0,
      totalFundedShares: financialAggregates._sum.shares || 0,
      recentContributions,
      recentProjects,
    };
  }
}
