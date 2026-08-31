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

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

function calculateStats(latencies: number[]) {
  latencies.sort((a, b) => a - b);
  const avg = (latencies.reduce((acc, val) => acc + val, 0) / latencies.length).toFixed(2);
  const p50 = latencies[Math.floor(latencies.length * 0.5)].toFixed(2);
  const p95 = latencies[Math.floor(latencies.length * 0.95)].toFixed(2);
  const p99 = latencies[Math.floor(latencies.length * 0.99)].toFixed(2);
  return { avg, p50, p95, p99 };
}

async function runBenchmark() {
  console.log('========================================================================');
  console.log('🚀 MASAJID FINAL PRODUCTION END-TO-END PERFORMANCE & LATENCY VALIDATION');
  console.log('========================================================================\n');

  await prisma.$connect();

  // (A) Project Count & List
  const projectLatencies: number[] = [];
  for (let i = 0; i < 3; i++) {
    const start = Date.now();
    await prisma.project.findMany({
      where: { isPublished: true },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { images: { orderBy: { sortOrder: 'asc' } } },
    });
    projectLatencies.push(Date.now() - start);
  }
  const pStats = calculateStats(projectLatencies);
  console.log(`[DB] Public Projects (findMany): P50=${pStats.p50}ms | P95=${pStats.p95}ms | P99=${pStats.p99}ms | Avg=${pStats.avg}ms`);

  // (B) Dashboard Aggregates
  const dashLatencies: number[] = [];
  for (let i = 0; i < 2; i++) {
    const start = Date.now();
    await Promise.all([
      prisma.project.count(),
      prisma.project.count({ where: { isPublished: true } }),
      prisma.contribution.count({ where: { status: 'PENDING' } }),
      prisma.contribution.count({ where: { status: 'APPROVED' } }),
      prisma.contribution.aggregate({
        where: { status: 'APPROVED' },
        _sum: { amount: true, shares: true },
      }),
    ]);
    dashLatencies.push(Date.now() - start);
  }
  const dStats = calculateStats(dashLatencies);
  console.log(`[DB] Dashboard Stats Aggregation: P50=${dStats.p50}ms | P95=${dStats.p95}ms | P99=${dStats.p99}ms | Avg=${dStats.avg}ms`);

  // (C) Bank Accounts
  const bankLatencies: number[] = [];
  for (let i = 0; i < 3; i++) {
    const start = Date.now();
    await prisma.bankAccount.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    bankLatencies.push(Date.now() - start);
  }
  const bStats = calculateStats(bankLatencies);
  console.log(`[DB] Public Bank Accounts (Indexed): P50=${bStats.p50}ms | P95=${bStats.p95}ms | P99=${bStats.p99}ms | Avg=${bStats.avg}ms`);

  console.log('\n========================================================================');
  await prisma.$disconnect();
}

runBenchmark().catch(console.error);
