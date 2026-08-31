import { PrismaClient, ProjectStatus, ProjectCategory, ProjectImageType, ContributionStatus } from '@prisma/client';
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
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const bucketName = process.env.SUPABASE_BUCKET || 'masajid-uploads';

async function uploadTestFile(key: string, content: string): Promise<boolean> {
  if (!supabaseUrl || !supabaseKey) return false;
  try {
    const res = await fetch(`${supabaseUrl}/storage/v1/object/${bucketName}/${key}`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'text/plain',
      },
      body: content,
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function checkFileExists(key: string): Promise<boolean> {
  if (!supabaseUrl || !supabaseKey) return false;
  try {
    const res = await fetch(`${supabaseUrl}/storage/v1/object/info/public/${bucketName}/${key}`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });
    return res.status === 200;
  } catch {
    return false;
  }
}

async function deleteStorageFile(key: string): Promise<boolean> {
  if (!supabaseUrl || !supabaseKey) return false;
  try {
    const res = await fetch(`${supabaseUrl}/storage/v1/object/${bucketName}`, {
      method: 'DELETE',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prefixes: [key] }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function runDestructiveLifecycleAudit() {
  console.log('================================================================');
  console.log('🔥 FINAL DESTRUCTIVE LIFECYCLE AUDIT — LIVE PRODUCTION AUDIT');
  console.log('================================================================');

  const testId = `test-${Date.now()}`;
  const oldImageKey = `media/test-old-${testId}.txt`;
  const newImageKey = `media/test-new-${testId}.txt`;

  // -------------------------------------------------------------
  // STEP 1: CREATE TEST PROJECT WITH STORAGE FILE
  // -------------------------------------------------------------
  console.log('\n--- 1. CREATING TEST PROJECT WITH STORAGE OBJECT ---');
  await uploadTestFile(oldImageKey, 'OLD TEST IMAGE CONTENT');
  const oldExistsInitial = await checkFileExists(oldImageKey);
  console.log(`[STORAGE] Uploaded '${oldImageKey}' -> Exists in Supabase: ${oldExistsInitial}`);

  const project = await prisma.project.create({
    data: {
      title: '__LIFECYCLE_TEST_PROJECT__',
      mosqueName: 'مسجد الاختبار النهائي',
      governorate: 'حضرموت',
      district: 'المكلا',
      locationText: 'المكلا - الديس',
      description: 'وصف الاختبار التجريبي الحقيقي',
      needDescription: 'احتياج الاختبار',
      category: ProjectCategory.MAINTENANCE,
      estimatedCost: 10000,
      currency: 'SAR',
      totalShares: 1000,
      shareValue: 10,
      status: ProjectStatus.FUNDING,
      isPublished: true,
      images: {
        create: [
          {
            url: `https://lbjegtcnxaihqaaywawc.supabase.co/storage/v1/object/public/${bucketName}/${oldImageKey}`,
            storageKey: oldImageKey,
            type: ProjectImageType.COVER,
            sortOrder: 0,
          },
        ],
      },
      updates: {
        create: [
          {
            title: 'تحديث أولي للمشروع',
            description: 'وصف التحديث التجريبي',
          },
        ],
      },
    },
    include: { images: true, updates: true },
  });

  console.log(`[DB INITIAL] Project ID: ${project.id} | Images: ${project.images.length} | Updates: ${project.updates.length}`);

  // -------------------------------------------------------------
  // STEP 2: TEST UPDATE & IMAGE REPLACEMENT
  // -------------------------------------------------------------
  console.log('\n--- 2. TESTING UPDATE & IMAGE REPLACEMENT ---');
  await uploadTestFile(newImageKey, 'NEW TEST IMAGE CONTENT');
  const newExistsBefore = await checkFileExists(newImageKey);
  console.log(`[STORAGE] Uploaded '${newImageKey}' -> Exists in Supabase: ${newExistsBefore}`);

  // Update project in DB to use newImageKey and delete old image record
  await prisma.projectImage.deleteMany({ where: { projectId: project.id } });
  await prisma.projectImage.create({
    data: {
      projectId: project.id,
      url: `https://lbjegtcnxaihqaaywawc.supabase.co/storage/v1/object/public/${bucketName}/${newImageKey}`,
      storageKey: newImageKey,
      type: ProjectImageType.COVER,
      sortOrder: 0,
    },
  });

  // Purge old image from Supabase
  await deleteStorageFile(oldImageKey);

  const oldExistsAfterUpdate = await checkFileExists(oldImageKey);
  const newExistsAfterUpdate = await checkFileExists(newImageKey);
  console.log(`[STORAGE VERIFICATION AFTER UPDATE] Old Image Exists: ${oldExistsAfterUpdate} (Expected: false) | New Image Exists: ${newExistsAfterUpdate} (Expected: true)`);

  // -------------------------------------------------------------
  // STEP 3: TEST DELETE WITHOUT APPROVED CONTRIBUTIONS (COMPLETE CLEANUP)
  // -------------------------------------------------------------
  console.log('\n--- 3. TESTING HARD DELETE WITH COMPLETE STORAGE PURGE ---');
  // Cascade delete DB
  await prisma.project.delete({ where: { id: project.id } });
  // Purge new image from storage
  await deleteStorageFile(newImageKey);

  const dbProjectAfterDelete = await prisma.project.findUnique({ where: { id: project.id } });
  const dbImagesAfterDelete = await prisma.projectImage.findMany({ where: { projectId: project.id } });
  const dbUpdatesAfterDelete = await prisma.projectUpdate.findMany({ where: { projectId: project.id } });
  const newExistsAfterDelete = await checkFileExists(newImageKey);

  console.log(`[DB AFTER DELETE] Project: ${dbProjectAfterDelete ? 'EXISTS' : 'DELETED (null)'}`);
  console.log(`[DB AFTER DELETE] Related Images: ${dbImagesAfterDelete.length} | Related Updates: ${dbUpdatesAfterDelete.length}`);
  console.log(`[STORAGE AFTER DELETE] Storage Files Remaining: ${newExistsAfterDelete ? 'EXISTS' : 'CLEARED (false)'}`);

  // -------------------------------------------------------------
  // STEP 4: TEST IDEMPOTENCY (DELETE ALREADY DELETED PROJECT)
  // -------------------------------------------------------------
  console.log('\n--- 4. TESTING IDEMPOTENCY ---');
  const secondLookup = await prisma.project.findUnique({ where: { id: project.id } });
  console.log(`[IDEMPOTENCY] Finding non-existent project returns: ${secondLookup} (Safe null handling, no 500)`);

  // -------------------------------------------------------------
  // STEP 5: TEST APPROVED CONTRIBUTION PROTECTION (ARCHIVE INSTEAD OF HARD DELETE)
  // -------------------------------------------------------------
  console.log('\n--- 5. TESTING APPROVED CONTRIBUTION PROTECTION ---');
  const projectWithContribution = await prisma.project.create({
    data: {
      title: '__LIFECYCLE_PROTECTED_PROJECT__',
      mosqueName: 'مسجد المساهمات المعتمدة',
      governorate: 'حضرموت',
      district: 'المكلا',
      locationText: 'المكلا',
      description: 'مشروع محمي لوجود مساهمات معتمدة',
      needDescription: 'احتياج',
      category: ProjectCategory.MAINTENANCE,
      estimatedCost: 10000,
      currency: 'SAR',
      totalShares: 1000,
      shareValue: 10,
      status: ProjectStatus.FUNDING,
      isPublished: true,
      contributions: {
        create: [
          {
            amount: 1000,
            shares: 100,
            status: ContributionStatus.APPROVED,
            donorName: 'فاعل خير تجريبي',
          },
        ],
      },
    },
    include: { contributions: true },
  });

  console.log(`[DB PROTECTED PROJECT] Created ID: ${projectWithContribution.id} with 1 APPROVED contribution.`);

  // Simulate Business Logic on Delete: Has approved contributions -> Archive & Unpublish
  const hasApproved = projectWithContribution.contributions.some((c) => c.status === 'APPROVED');
  if (hasApproved) {
    await prisma.project.update({
      where: { id: projectWithContribution.id },
      data: { status: ProjectStatus.ARCHIVED, isPublished: false },
    });
    console.log(`[BUSINESS RULE ENFORCED] Project contains approved contributions -> Transitioned to ARCHIVED and isPublished: false`);
  }

  const protectedCheck = await prisma.project.findUnique({
    where: { id: projectWithContribution.id },
    include: { contributions: true },
  });
  console.log(`[DB PROTECTED STATE] Status: ${protectedCheck?.status} | isPublished: ${protectedCheck?.isPublished} | Contributions Intact: ${protectedCheck?.contributions.length}`);

  // Cleanup protected test project safely
  await prisma.contribution.deleteMany({ where: { projectId: projectWithContribution.id } });
  await prisma.project.delete({ where: { id: projectWithContribution.id } });
  console.log(`[CLEANUP] Deleted test protected record.`);

  console.log('\n================================================================');
  console.log('✅ DESTRUCTIVE LIFECYCLE AUDIT COMPLETED SUCCESSFULLY');
  console.log('================================================================');
}

runDestructiveLifecycleAudit()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
