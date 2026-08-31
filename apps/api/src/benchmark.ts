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

async function runBenchmark() {
  console.log('=====================================================');
  console.log('⚡ MASAJID PERFORMANCE & DB LATENCY BENCHMARK');
  console.log('=====================================================');

  try {
    // Warmup
    await prisma.$connect();
    await prisma.project.count();

    // 1. Benchmark Project Count
    const countStarts = Date.now();
    for (let i = 0; i < 5; i++) {
      await prisma.project.count({ where: { isPublished: true } });
    }
    const countAvg = (Date.now() - countStarts) / 5;
    console.log(`[DB] Project.count (Filtered) Avg: ${countAvg.toFixed(2)} ms`);

    // 2. Benchmark Public Project Listing (with images)
    const listStarts = Date.now();
    for (let i = 0; i < 5; i++) {
      await prisma.project.findMany({
        where: { isPublished: true },
        include: { images: { orderBy: { sortOrder: 'asc' } } },
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    }
    const listAvg = (Date.now() - listStarts) / 5;
    console.log(`[DB] Public Project List (10 items + images) Avg: ${listAvg.toFixed(2)} ms`);

    // 3. Benchmark Financial Aggregates
    const aggStarts = Date.now();
    for (let i = 0; i < 5; i++) {
      await prisma.contribution.aggregate({
        where: { status: 'APPROVED' },
        _sum: { amount: true, shares: true },
      });
    }
    const aggAvg = (Date.now() - aggStarts) / 5;
    console.log(`[DB] Contribution.aggregate (_sum amount & shares) Avg: ${aggAvg.toFixed(2)} ms`);

    // 4. Benchmark Combined Dashboard Stats Parallel Query
    const dashStarts = Date.now();
    for (let i = 0; i < 5; i++) {
      await Promise.all([
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
    }
    const dashAvg = (Date.now() - dashStarts) / 5;
    console.log(`[API/DB] Full Dashboard Stats Parallel Query Avg: ${dashAvg.toFixed(2)} ms`);
    console.log('=====================================================');
  } catch (err: any) {
    console.error('Benchmark error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

runBenchmark();
