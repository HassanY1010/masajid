import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// Read .env manually
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const [k, ...v] = line.split('=');
    if (k && v.length) process.env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
  });
}

const prisma = new PrismaClient();

async function profileEndpoints() {
  console.log('================================================================');
  console.log('📊 MASAJID BACKEND & DATABASE DEEP LATENCY PROFILING');
  console.log('================================================================');

  await prisma.$connect();

  // Test 1: Projects Query (findMany + count in parallel)
  const pStart = Date.now();
  const [projects, pTotal] = await Promise.all([
    prisma.project.findMany({
      where: { isPublished: true },
      include: { images: { orderBy: { sortOrder: 'asc' } } },
      take: 10,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.project.count({ where: { isPublished: true } }),
  ]);
  const pDuration = Date.now() - pStart;
  console.log(`[1] GET /api/projects: ${pDuration}ms (Items: ${projects.length}, Total: ${pTotal})`);

  // Test 2: Single Project by ID
  if (projects.length > 0) {
    const sStart = Date.now();
    const single = await prisma.project.findFirst({
      where: { id: projects[0].id, isPublished: true },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        updates: { orderBy: { createdAt: 'desc' } },
      },
    });
    const sDuration = Date.now() - sStart;
    console.log(`[2] GET /api/projects/:id: ${sDuration}ms (ID: ${single?.id})`);
  }

  // Test 3: Dashboard Stats Aggregation
  const dStart = Date.now();
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
    prisma.project.count(),
    prisma.project.count({ where: { isPublished: true } }),
    prisma.project.count({ where: { isPublished: true, status: 'FUNDING' } }),
    prisma.project.count({ where: { status: { in: ['FULLY_FUNDED', 'COMPLETED'] } } }),
    prisma.contribution.count({ where: { status: 'PENDING' } }),
    prisma.contribution.count({ where: { status: 'APPROVED' } }),
    prisma.contribution.aggregate({
      where: { status: 'APPROVED' },
      _sum: { amount: true, shares: true },
    }),
    prisma.contribution.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { project: { select: { id: true, title: true, mosqueName: true } } },
    }),
    prisma.project.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { images: { take: 1, orderBy: { sortOrder: 'asc' } } },
    }),
  ]);
  const dDuration = Date.now() - dStart;
  console.log(`[3] GET /api/admin/dashboard/stats: ${dDuration}ms`);

  // Test 4: Admin Contributions Query
  const cStart = Date.now();
  const [contribs, cTotal] = await Promise.all([
    prisma.contribution.findMany({
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
      take: 20,
    }),
    prisma.contribution.count(),
  ]);
  const cDuration = Date.now() - cStart;
  console.log(`[4] GET /api/admin/contributions: ${cDuration}ms (Count: ${contribs.length})`);

  // Test 5: Bank Accounts (Indexed on isActive, sortOrder)
  const bStart = Date.now();
  const banks = await prisma.bankAccount.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });
  const bDuration = Date.now() - bStart;
  console.log(`[5] GET /api/bank-accounts/public: ${bDuration}ms (Count: ${banks.length})`);

  console.log('================================================================');
  await prisma.$disconnect();
}

profileEndpoints();
