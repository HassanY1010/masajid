import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { CloudStorageService } from '../uploads/cloud-storage.service';
import {
  CreateProjectDto,
  UpdateProjectDto,
  CreateProjectUpdateDto,
} from './dto/project.dto';
import {
  ProjectStatus,
  ProjectCategory,
  AuditAction,
  ProjectImageType,
} from '@masajid/shared-types';
import { MemoryCacheService } from '../common/cache/memory-cache.service';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly storageService: CloudStorageService,
    private readonly cache: MemoryCacheService,
  ) {}

  // Enrich project with calculated financial fields
  private formatProject(project: any) {
    const remainingShares = Math.max(0, project.totalShares - project.fundedShares);
    const remainingAmount = Math.max(0, project.estimatedCost - project.fundedAmount);
    const fundingPercentage = project.totalShares > 0
      ? Math.min(100, Math.round((project.fundedShares / project.totalShares) * 100))
      : 0;

    return {
      ...project,
      remainingShares,
      remainingAmount,
      fundingPercentage,
    };
  }

  // Public: Get all published projects
  async getPublicProjects(query: {
    category?: ProjectCategory;
    governorate?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(50, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const cacheKey = `projects:public:${query.category || 'all'}:${query.governorate || 'all'}:${query.search || ''}:${page}:${limit}`;

    return this.cache.getOrSet(cacheKey, 5000, async () => {
      const where: any = {
        isPublished: true,
        status: {
          in: [ProjectStatus.PUBLISHED, ProjectStatus.FUNDING, ProjectStatus.FULLY_FUNDED, ProjectStatus.IN_PROGRESS, ProjectStatus.COMPLETED],
        },
      };

      if (query.category) {
        where.category = query.category;
      }

      if (query.governorate) {
        where.governorate = query.governorate;
      }

      if (query.search && query.search.trim()) {
        const s = query.search.trim();
        where.OR = [
          { title: { contains: s, mode: 'insensitive' } },
          { mosqueName: { contains: s, mode: 'insensitive' } },
          { governorate: { contains: s, mode: 'insensitive' } },
          { district: { contains: s, mode: 'insensitive' } },
        ];
      }

      const [items, total] = await Promise.all([
        this.prisma.project.findMany({
          where,
          include: {
            images: {
              orderBy: { sortOrder: 'asc' },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.project.count({ where }),
      ]);

      return {
        items: items.map((p) => {
          const formatted = this.formatProject(p);
          // Exclude unnecessary deep internal relations from public list query
          return {
            ...formatted,
            // Guarantee clean cover image URL for fast mobile cards
            coverImageUrl: formatted.images?.find((img: any) => img.type === 'COVER')?.url || formatted.images?.[0]?.url || null,
          };
        }),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    });
  }

  // Public: Get single project details
  async getPublicProjectById(id: string) {
    const cacheKey = `project:public:${id}`;
    return this.cache.getOrSet(cacheKey, 30000, async () => {
      const project = await this.prisma.project.findFirst({
        where: { id, isPublished: true },
        include: {
          images: { orderBy: { sortOrder: 'asc' } },
          updates: { orderBy: { createdAt: 'desc' } },
        },
      });

      if (!project) {
        throw new NotFoundException('المشروع غير موجود أو غير متاح حالياً');
      }

      return this.formatProject(project);
    });
  }

  // Admin: Get all projects (including Drafts and Archived)
  async getAdminProjects(query: {
    status?: ProjectStatus;
    category?: ProjectCategory;
    isPublished?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 15));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    if (typeof query.isPublished === 'boolean') {
      where.isPublished = query.isPublished;
    }

    if (query.category) {
      where.category = query.category;
    }

    if (query.search && query.search.trim()) {
      const s = query.search.trim();
      where.OR = [
        { title: { contains: s, mode: 'insensitive' } },
        { mosqueName: { contains: s, mode: 'insensitive' } },
        { governorate: { contains: s, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        include: {
          images: { orderBy: { sortOrder: 'asc' } },
          _count: {
            select: { contributions: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      items: items.map((p) => this.formatProject(p)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Admin: Get single project by ID (draft, published, or any state)
  async getAdminProjectById(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        updates: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!project) {
      throw new NotFoundException('المشروع غير موجود');
    }

    return this.formatProject(project);
  }

  // Admin: Create new project
  async createProject(dto: CreateProjectDto, adminId?: string) {
    // Validate mathematical formula: totalShares * shareValue == estimatedCost
    const calculatedCost = dto.totalShares * dto.shareValue;
    if (Math.abs(calculatedCost - dto.estimatedCost) > 0.01) {
      throw new BadRequestException(
        `خطأ حسابي: عدد الأسهم (${dto.totalShares}) × قيمة السهم (${dto.shareValue}) = ${calculatedCost} لا يساوي التكلفة المقدرة (${dto.estimatedCost})`,
      );
    }

    const { images, ...projectData } = dto;

    const project = await this.prisma.project.create({
      data: {
        ...projectData,
        status: ProjectStatus.FUNDING,
        isPublished: true,
        publishedAt: new Date(),
        images: images && images.length > 0
          ? {
              create: images.map((img, idx) => ({
                url: img.url,
                storageKey: img.storageKey,
                type: img.type || ProjectImageType.GALLERY,
                sortOrder: img.sortOrder ?? idx,
              })),
            }
          : undefined,
      },
      include: {
        images: true,
      },
    });

    await this.auditService.log({
      adminId,
      action: AuditAction.ADMIN_CREATED_PROJECT,
      entity: 'Project',
      entityId: project.id,
      metadata: { title: project.title, mosqueName: project.mosqueName },
    });

    // Invalidate project and dashboard stats caches immediately
    this.cache.invalidate('projects');
    this.cache.invalidate('admin:dashboard');

    return this.formatProject(project);
  }

  // Admin: Update project
  async updateProject(id: string, dto: UpdateProjectDto, adminId?: string) {
    const existing = await this.prisma.project.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!existing) {
      throw new NotFoundException('المشروع غير موجود');
    }

    // Check financial rule if costs or shares are being modified
    const totalShares = dto.totalShares ?? existing.totalShares;
    const shareValue = dto.shareValue ?? existing.shareValue;
    const estimatedCost = dto.estimatedCost ?? existing.estimatedCost;

    if (
      dto.totalShares !== undefined ||
      dto.shareValue !== undefined ||
      dto.estimatedCost !== undefined
    ) {
      // If already funded or approved contributions exist, forbid modifying shares
      if (existing.fundedShares > 0 && (dto.totalShares || dto.shareValue)) {
        throw new BadRequestException(
          'لا يمكن تعديل هيكل الأسهم لمشروع بدأت فيه المساهمات وتلقى مبالغ معتمدة',
        );
      }

      if (Math.abs(totalShares * shareValue - estimatedCost) > 0.01) {
        throw new BadRequestException(
          `خطأ حسابي: عدد الأسهم (${totalShares}) × قيمة السهم (${shareValue}) لا يساوي التكلفة المقدرة (${estimatedCost})`,
        );
      }
    }

    const { images, ...updateData } = dto;

    const project = await this.prisma.project.update({
      where: { id },
      data: {
        ...updateData,
        images: images
          ? {
              deleteMany: {},
              create: images.map((img, idx) => ({
                url: img.url,
                storageKey: img.storageKey,
                type: img.type || ProjectImageType.GALLERY,
                sortOrder: img.sortOrder ?? idx,
              })),
            }
          : undefined,
      },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        updates: { orderBy: { createdAt: 'desc' } },
      },
    });

    await this.auditService.log({
      adminId,
      action: AuditAction.ADMIN_UPDATED_PROJECT,
      entity: 'Project',
      entityId: project.id,
      metadata: dto,
    });

    return this.formatProject(project);
  }

  // Admin: Publish / Unpublish project with validation
  async setPublishStatus(id: string, isPublished: boolean, adminId?: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!project) {
      throw new NotFoundException('المشروع غير موجود');
    }

    if (isPublished) {
      // Validate all publishing requirements
      if (!project.mosqueName || !project.governorate || !project.district || !project.description) {
        throw new BadRequestException('بيانات المسجد والموقع والوصف مطلوبة للنشر');
      }
      if (project.totalShares <= 0 || project.shareValue <= 0 || project.estimatedCost <= 0) {
        throw new BadRequestException('البيانات المالية غير مكتملة');
      }
      if (Math.abs(project.totalShares * project.shareValue - project.estimatedCost) > 0.01) {
        throw new BadRequestException('قيمة الأسهم لا تتطابق مع التكلفة المقدرة');
      }

      const hasCover = project.images.some((img) => img.type === ProjectImageType.COVER);
      if (!hasCover && project.images.length === 0) {
        throw new BadRequestException('يجب إضافة صورة غلاف (Cover) على الأقل قبل نشر المشروع');
      }
    }

    const newStatus = isPublished
      ? project.fundedShares >= project.totalShares
        ? ProjectStatus.FULLY_FUNDED
        : ProjectStatus.FUNDING
      : ProjectStatus.DRAFT;

    const updated = await this.prisma.project.update({
      where: { id },
      data: {
        isPublished,
        publishedAt: isPublished ? project.publishedAt || new Date() : null,
        status: newStatus,
      },
      include: { images: true },
    });

    await this.auditService.log({
      adminId,
      action: isPublished
        ? AuditAction.ADMIN_PUBLISHED_PROJECT
        : AuditAction.ADMIN_UNPUBLISHED_PROJECT,
      entity: 'Project',
      entityId: project.id,
    });

    this.cache.invalidate('projects');
    this.cache.invalidate('admin:dashboard');

    return this.formatProject(updated);
  }

  // Admin: Add Project Progress Update
  async addProjectUpdate(id: string, dto: CreateProjectUpdateDto, adminId?: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw new NotFoundException('المشروع غير موجود');
    }

    const update = await this.prisma.projectUpdate.create({
      data: {
        projectId: id,
        title: dto.title,
        description: dto.description,
        images: dto.images || [],
      },
    });

    await this.auditService.log({
      adminId,
      action: AuditAction.ADMIN_CREATED_UPDATE,
      entity: 'ProjectUpdate',
      entityId: update.id,
      metadata: { projectId: id, title: dto.title },
    });

    return update;
  }

  // Admin: Delete / Archive project with Complete Storage & Database Cleanup
  async deleteProject(id: string, adminId?: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        images: true,
        contributions: true,
        updates: true,
      },
    });

    if (!project) {
      throw new NotFoundException('المشروع غير موجود');
    }

    // If there are approved contributions, archive rather than hard delete for financial audit compliance
    const hasApproved = project.contributions.some((c) => c.status === 'APPROVED');
    if (hasApproved) {
      await this.prisma.project.update({
        where: { id },
        data: { status: ProjectStatus.ARCHIVED, isPublished: false },
      });

      await this.auditService.log({
        adminId,
        action: AuditAction.ADMIN_ARCHIVED_PROJECT,
        entity: 'Project',
        entityId: id,
      });

      return { message: 'تمت أرشفة المشروع نظراً لوجود مساهمات مسجلة عليه' };
    }

    // Collect all storage keys associated with this project (images, receipts, update images)
    const storageKeys: string[] = [];
    
    // Project images
    project.images.forEach((img) => {
      if (img.storageKey) storageKeys.push(img.storageKey);
    });

    // Pending/Rejected contribution receipts
    project.contributions.forEach((c) => {
      if (c.receiptStorageKey) storageKeys.push(c.receiptStorageKey);
    });

    // 1. Delete from database in cascade
    await this.prisma.project.delete({ where: { id } });

    // 2. Perform Storage Cleanup on Supabase and local disk
    if (storageKeys.length > 0) {
      this.storageService.deleteFiles(storageKeys).catch((err) => {
        this.logger.error(`Storage cleanup failed for deleted project ${id}: ${err.message}`);
      });
    }

    await this.auditService.log({
      adminId,
      action: AuditAction.ADMIN_DELETED_PROJECT,
      entity: 'Project',
      entityId: id,
    });

    this.cache.invalidate('projects');
    this.cache.invalidate('admin:dashboard');

    return { message: 'تم حذف المشروع بنجاح' };
  }
}
