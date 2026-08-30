import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ProjectsService } from './projects/projects.service';
import { ContributionsService } from './contributions/contributions.service';
import { BankAccountsService } from './bank-accounts/bank-accounts.service';
import { AuthService } from './auth/auth.service';
import { PrismaService } from './prisma/prisma.service';
import { AuditService } from './common/audit/audit.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ProjectCategory, ProjectStatus, ContributionStatus } from '@masajid/shared-types';
import * as bcrypt from 'bcryptjs';

describe('Comprehensive End-to-End System Audit & Verification', () => {
  // In-memory persistent state across test flow
  let adminRecord: any;
  let projectRecord: any;
  let bankAccountRecord: any;
  let contributionRecord1: any;
  let contributionRecord2: any;

  const contributionsMap = new Map<string, any>();

  // Mock Prisma transactional database
  const mockPrisma: any = {
    admin: {
      findUnique: jest.fn().mockImplementation(async ({ where }) => {
        if (where.email === 'admin@masajid.app' || where.id === 'admin-uuid-1') {
          return adminRecord;
        }
        return null;
      }),
      update: jest.fn().mockImplementation(async ({ data }) => {
        adminRecord = { ...adminRecord, ...data };
        return adminRecord;
      }),
    },
    project: {
      create: jest.fn().mockImplementation(async ({ data }) => {
        projectRecord = {
          id: 'project-uuid-101',
          ...data,
          fundedShares: 0,
          fundedAmount: 0.0,
          status: ProjectStatus.DRAFT,
          isPublished: false,
          images: data.images?.create || [],
          updates: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        return projectRecord;
      }),
      findUnique: jest.fn().mockImplementation(async ({ where }) => {
        if (where.id === projectRecord?.id) return projectRecord;
        return null;
      }),
      findFirst: jest.fn().mockImplementation(async ({ where }) => {
        if (where.id === projectRecord?.id && (where.isPublished ? projectRecord.isPublished : true)) {
          return projectRecord;
        }
        return null;
      }),
      findMany: jest.fn().mockImplementation(async () => [projectRecord]),
      count: jest.fn().mockResolvedValue(1),
      update: jest.fn().mockImplementation(async ({ where, data }) => {
        projectRecord = { ...projectRecord, ...data };
        return projectRecord;
      }),
      delete: jest.fn().mockImplementation(async () => projectRecord),
    },
    contribution: {
      create: jest.fn().mockImplementation(async ({ data }) => {
        const item = {
          id: `contrib-uuid-${Date.now()}-${Math.random()}`,
          ...data,
          status: ContributionStatus.PENDING,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        contributionsMap.set(item.id, item);
        return item;
      }),
      findUnique: jest.fn().mockImplementation(async ({ where }) => {
        return contributionsMap.get(where.id) || null;
      }),
      findMany: jest.fn().mockImplementation(async () => Array.from(contributionsMap.values())),
      count: jest.fn().mockImplementation(async () => contributionsMap.size),
      update: jest.fn().mockImplementation(async ({ where, data }) => {
        const item = contributionsMap.get(where.id);
        if (item) {
          const updated = { ...item, ...data };
          contributionsMap.set(where.id, updated);
          return updated;
        }
        return null;
      }),
    },
    bankAccount: {
      create: jest.fn().mockImplementation(async ({ data }) => {
        bankAccountRecord = { id: 'bank-uuid-1', ...data, createdAt: new Date(), updatedAt: new Date() };
        return bankAccountRecord;
      }),
      findMany: jest.fn().mockImplementation(async () => [bankAccountRecord].filter(Boolean)),
      findUnique: jest.fn().mockImplementation(async () => bankAccountRecord),
      update: jest.fn().mockImplementation(async ({ data }) => {
        bankAccountRecord = { ...bankAccountRecord, ...data };
        return bankAccountRecord;
      }),
      delete: jest.fn().mockImplementation(async () => bankAccountRecord),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
    $transaction: jest.fn().mockImplementation(async (callback) => callback(mockPrisma)),
  };

  let authService: AuthService;
  let projectsService: ProjectsService;
  let contributionsService: ContributionsService;
  let bankAccountsService: BankAccountsService;

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash('AdminPassword123!', 10);
    adminRecord = {
      id: 'admin-uuid-1',
      email: 'admin@masajid.app',
      name: 'مدير المنصة',
      passwordHash,
      isActive: true,
      createdAt: new Date(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        ProjectsService,
        ContributionsService,
        BankAccountsService,
        AuditService,
        JwtService,
        ConfigService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    projectsService = module.get<ProjectsService>(ProjectsService);
    contributionsService = module.get<ContributionsService>(ContributionsService);
    bankAccountsService = module.get<BankAccountsService>(BankAccountsService);
  });

  // STEP 1: Admin Authentication
  test('Audit 1: Admin logs in successfully with valid credentials and receives JWT', async () => {
    const res = await authService.login({
      email: 'admin@masajid.app',
      password: 'AdminPassword123!',
    });
    expect(res).toBeDefined();
    expect(res.accessToken).toBeDefined();
    expect(res.admin.email).toBe('admin@masajid.app');
  });

  test('Audit 2: Admin login fails with wrong credentials', async () => {
    await expect(
      authService.login({
        email: 'admin@masajid.app',
        password: 'WrongPassword!',
      }),
    ).rejects.toThrow('البريد الإلكتروني أو كلمة المرور غير صحيحة');
  });

  // STEP 2: Bank Accounts Management
  test('Audit 3: Admin creates bank account & visitor retrieves only active bank accounts', async () => {
    const created = await bankAccountsService.createAccount({
      name: 'AlAmqi',
      displayName: 'شركة العمقي وإخوانه للصرافة',
      accountName: 'مشروع مساجد لخدمة بيوت الله',
      accountNumber: '254019283',
      currency: 'SAR',
      isActive: true,
    });
    expect(created.displayName).toBe('شركة العمقي وإخوانه للصرافة');

    const publicAccounts = await bankAccountsService.getPublicAccounts();
    expect(publicAccounts.length).toBe(1);
    expect(publicAccounts[0].accountNumber).toBe('254019283');
  });

  // STEP 3: Project Creation with Mathematical Verification
  test('Audit 4: Admin creates project with matching formula (2000 * 10 == 20000)', async () => {
    const project = await projectsService.createProject({
      title: 'تركيب منظومة طاقة شمسية',
      mosqueName: 'مسجد التقوى',
      governorate: 'حضرموت',
      district: 'غيل باوزير',
      locationText: 'حي السلام',
      description: 'مشروع طاقة شمسية متكامل لخدمة المصلين وتوفير التكييف المستمر',
      needDescription: '16 لوح طاقة، 4 بطاريات ليثيوم، محول هجين',
      category: ProjectCategory.SOLAR,
      estimatedCost: 20000,
      currency: 'SAR',
      totalShares: 2000,
      shareValue: 10,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1542838132-92c53300491e',
          storageKey: 'sample/mosque1.jpg',
          type: 'COVER' as any,
          sortOrder: 0,
        },
      ],
    });

    expect(project.id).toBe('project-uuid-101');
    expect(project.remainingShares).toBe(2000);
    expect(project.remainingAmount).toBe(20000);
    expect(project.fundingPercentage).toBe(0);
    expect(project.isPublished).toBe(false);
  });

  test('Audit 5: Rejects project creation when totalShares * shareValue != estimatedCost', async () => {
    await expect(
      projectsService.createProject({
        title: 'مشروع مكسور الحسابات',
        mosqueName: 'مسجد النور',
        governorate: 'عدن',
        district: 'المنصورة',
        locationText: 'الشارع الرئيسي',
        description: 'وصف المشروع التجريبي',
        needDescription: 'احتياج فني',
        category: ProjectCategory.MAINTENANCE,
        estimatedCost: 20000,
        currency: 'SAR',
        totalShares: 1500, // 1500 * 10 = 15000 != 20000
        shareValue: 10,
      }),
    ).rejects.toThrow('خطأ حسابي');
  });

  // STEP 4: Project Publishing
  test('Audit 6: Admin publishes project and visitor views it in public list', async () => {
    const published = await projectsService.setPublishStatus('project-uuid-101', true);
    expect(published.isPublished).toBe(true);
    expect(published.status).toBe(ProjectStatus.FUNDING);

    const publicList = await projectsService.getPublicProjects({});
    expect(publicList.items.length).toBe(1);
    expect(publicList.items[0].mosqueName).toBe('مسجد التقوى');
  });

  // STEP 5: Visitor Submits Contribution & Share Calculation
  test('Audit 7: Visitor submits contribution of 100 SAR -> 10 shares as PENDING (no impact on fundedShares yet)', async () => {
    contributionRecord1 = await contributionsService.createContribution(
      {
        projectId: 'project-uuid-101',
        amount: 100,
        currency: 'SAR',
        paymentMethod: 'AlAmqi',
        donorName: 'فاعل خير',
      },
      {
        url: '/uploads/receipts/receipt-101.jpg',
        storageKey: 'receipts/receipt-101.jpg',
      },
    );

    expect(contributionRecord1.shares).toBe(10);
    expect(contributionRecord1.status).toBe(ContributionStatus.PENDING);

    // Project should still have 0 fundedShares because contribution is PENDING
    const project = await projectsService.getPublicProjectById('project-uuid-101');
    expect(project.fundedShares).toBe(0);
    expect(project.remainingShares).toBe(2000);
  });

  // STEP 6: Admin Approves Contribution -> Shares Increment Atomically
  test('Audit 8: Admin approves contribution -> fundedShares = 10, fundedAmount = 100 SAR, remainingShares = 1990', async () => {
    const approved = await contributionsService.approveContribution(contributionRecord1.id);
    expect(approved.status).toBe(ContributionStatus.APPROVED);

    const project = await projectsService.getPublicProjectById('project-uuid-101');
    expect(project.fundedShares).toBe(10);
    expect(project.fundedAmount).toBe(100);
    expect(project.remainingShares).toBe(1990);
    expect(project.remainingAmount).toBe(19900);
    expect(project.fundingPercentage).toBe(1);
  });

  // STEP 7: Prevent Double Approval
  test('Audit 9: Prevent duplicate approval on already approved contribution', async () => {
    await expect(
      contributionsService.approveContribution(contributionRecord1.id),
    ).rejects.toThrow('تمت الموافقة على هذه المساهمة مسبقاً');
  });

  // STEP 8: Reject Contribution Workflow
  test('Audit 10: Admin rejects unverified contribution -> marked REJECTED without altering shares', async () => {
    contributionRecord2 = await contributionsService.createContribution(
      {
        projectId: 'project-uuid-101',
        amount: 50,
        currency: 'SAR',
      },
      { url: '/uploads/receipts/receipt-fake.jpg', storageKey: 'receipts/fake.jpg' },
    );

    const rejected = await contributionsService.rejectContribution(contributionRecord2.id, {
      reason: 'سند التحويل غير واضح',
    });

    expect(rejected.status).toBe(ContributionStatus.REJECTED);
    expect(rejected.rejectionReason).toBe('سند التحويل غير واضح');

    // Shares remain unaffected
    const project = await projectsService.getPublicProjectById('project-uuid-101');
    expect(project.fundedShares).toBe(10);
    expect(project.remainingShares).toBe(1990);
  });

  // STEP 9: Prevent Overfunding
  test('Audit 11: Prevent contribution exceeding remaining project shares', async () => {
    // Modify mock project to have only 5 shares remaining
    projectRecord.fundedShares = 1995;
    projectRecord.fundedAmount = 19950;

    await expect(
      contributionsService.createContribution({
        projectId: 'project-uuid-101',
        amount: 60, // 6 shares > 5 remaining
        currency: 'SAR',
      }),
    ).rejects.toThrow('يتجاوز الأسهم المتبقية للمشروع');
  });

  // STEP 10: Automatic Project Completion when Fully Funded
  test('Audit 12: Project automatically transitions to FULLY_FUNDED when fundedShares == totalShares', async () => {
    // Add contribution for the exact 5 remaining shares (50 SAR)
    const finalContrib = await contributionsService.createContribution({
      projectId: 'project-uuid-101',
      amount: 50,
      currency: 'SAR',
    });

    await contributionsService.approveContribution(finalContrib.id);

    const project = await projectsService.getPublicProjectById('project-uuid-101');
    expect(project.fundedShares).toBe(2000);
    expect(project.fundedAmount).toBe(20000);
    expect(project.remainingShares).toBe(0);
    expect(project.status).toBe(ProjectStatus.FULLY_FUNDED);
  });
});
