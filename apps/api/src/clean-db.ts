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

async function purgeDatabase() {
  console.log('🧹 [PURGE] Cleaning all projects, contributions, images, updates, and audit logs from Production Database...');
  
  await prisma.$connect();

  // 1. Delete Contributions
  const deletedContributions = await prisma.contribution.deleteMany({});
  console.log(`✓ Deleted ${deletedContributions.count} contributions.`);

  // 2. Delete Project Updates
  const deletedUpdates = await prisma.projectUpdate.deleteMany({});
  console.log(`✓ Deleted ${deletedUpdates.count} project updates.`);

  // 3. Delete Project Images
  const deletedImages = await prisma.projectImage.deleteMany({});
  console.log(`✓ Deleted ${deletedImages.count} project images.`);

  // 4. Delete Projects
  const deletedProjects = await prisma.project.deleteMany({});
  console.log(`✓ Deleted ${deletedProjects.count} projects.`);

  // 5. Delete Audit Logs
  const deletedAuditLogs = await prisma.auditLog.deleteMany({});
  console.log(`✓ Deleted ${deletedAuditLogs.count} audit logs.`);

  console.log('✨ [PURGE COMPLETED] Database is now 100% clean and fresh from zero!');

  await prisma.$disconnect();
}

purgeDatabase().catch((e) => {
  console.error('Error purging database:', e);
  process.exit(1);
});
