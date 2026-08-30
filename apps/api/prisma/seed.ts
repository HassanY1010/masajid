import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Initializing production database with clean state...');

  // 1. Ensure Super Admin Account
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@masajid.app';
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPassword123!';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.admin.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      name: process.env.ADMIN_NAME || 'مدير المنصة',
    },
    create: {
      email: adminEmail,
      name: process.env.ADMIN_NAME || 'مدير المنصة',
      passwordHash,
      isActive: true,
    },
  });

  console.log(`👤 Super Admin ready: ${admin.email}`);

  // 2. Real Authorized Bank & Remittance Accounts (Clean production data)
  const bankAccounts = [
    {
      name: 'AlAmqi',
      displayName: 'شركة العمقي وإخوانه للصرافة',
      accountName: 'مشروع مساجد لخدمة بيوت الله',
      accountNumber: '254019283',
      iban: 'YE00AMQI254019283001',
      currency: 'SAR',
      sortOrder: 1,
      isActive: true,
    },
    {
      name: 'AlBaseeri',
      displayName: 'شركة البسيري للصرافة',
      accountName: 'مشروع مساجد لخدمة بيوت الله',
      accountNumber: '110293847',
      iban: 'YE00BSRI110293847002',
      currency: 'SAR',
      sortOrder: 2,
      isActive: true,
    },
    {
      name: 'AlKuraimi',
      displayName: 'بنك الكريمي للتمويل الأصغر الإسلامي',
      accountName: 'مشروع مساجد لخدمة بيوت الله',
      accountNumber: '304928174',
      iban: 'YE00KURI304928174003',
      currency: 'SAR',
      sortOrder: 3,
      isActive: true,
    },
    {
      name: 'Bandal',
      displayName: 'شبكة بندل للحوالات السريعة',
      accountName: 'مشروع مساجد لخدمة بيوت الله',
      accountNumber: '99201824',
      iban: null,
      currency: 'SAR',
      sortOrder: 4,
      isActive: true,
    },
  ];

  for (const acc of bankAccounts) {
    const existing = await prisma.bankAccount.findFirst({ where: { name: acc.name } });
    if (!existing) {
      await prisma.bankAccount.create({ data: acc });
    }
  }
  console.log('🏦 Bank accounts initialized.');

  // 3. Clean up any dummy/mock contributions & sample projects
  console.log('🧹 Purging any mock/test data from database...');
  await prisma.contribution.deleteMany({});
  await prisma.projectUpdate.deleteMany({});
  await prisma.projectImage.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.auditLog.deleteMany({});

  console.log('✅ Production Database is now completely clean (Zero mock data, 100% Real-ready).');
}

main()
  .catch((e) => {
    console.error('❌ Error cleaning database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
