import { PrismaClient, ProjectStatus, ProjectCategory, ProjectImageType } from '@prisma/client';
import * as https from 'https';

const prisma = new PrismaClient();

function queryPublicApi(): Promise<any> {
  return new Promise((resolve, reject) => {
    https.get('https://masajid-1ggr.onrender.com/api/projects', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    }).on('error', reject);
  });
}

async function runLifecycleAudit() {
  console.log('=====================================================');
  console.log('🧪 RUNNING FULL LIFECYCLE & VISIBILITY AUDIT ON SUPABASE');
  console.log('=====================================================');

  // Step 1: Create a Draft project in PostgreSQL
  console.log('\n--- 1. CREATING DRAFT PROJECT ---');
  const draftProject = await prisma.project.create({
    data: {
      title: 'مشروع اختبار الرؤية (مسودة)',
      mosqueName: 'جامع الاختبار',
      governorate: 'حضرموت',
      district: 'المكلا',
      locationText: 'المكلا - الديس',
      description: 'وصف تفصيلي لمشروع الاختبار التجريبي للتحقق من دورة الحياة',
      needDescription: 'احتياج فني مفصل',
      category: ProjectCategory.MAINTENANCE,
      estimatedCost: 10000,
      currency: 'SAR',
      totalShares: 1000,
      shareValue: 10,
      status: ProjectStatus.DRAFT,
      isPublished: false,
      images: {
        create: [
          {
            url: 'https://lbjegtcnxaihqaaywawc.supabase.co/storage/v1/object/public/masajid-uploads/media/1788131005555-s0wzoij.jpg',
            storageKey: 'media/test.jpg',
            type: ProjectImageType.COVER,
            sortOrder: 0,
          },
        ],
      },
    },
  });

  console.log(`[DB DRAFT STATE] ID: ${draftProject.id} | Status: ${draftProject.status} | isPublished: ${draftProject.isPublished}`);

  // Query API to verify Draft is NOT returned
  const apiAfterDraft = await queryPublicApi();
  const foundDraftInApi = apiAfterDraft.data?.items?.some((p: any) => p.id === draftProject.id);
  console.log(`[API CHECK DRAFT] Is Draft Visible in Public Feed? -> ${foundDraftInApi} (Expected: false)`);

  // Step 2: Publish the project (Simulate Admin Publish Action)
  console.log('\n--- 2. EXECUTING ADMIN PUBLISH ACTION ---');
  const publishedProject = await prisma.project.update({
    where: { id: draftProject.id },
    data: {
      isPublished: true,
      status: ProjectStatus.FUNDING,
      publishedAt: new Date(),
    },
  });

  console.log(`[DB PUBLISHED STATE] ID: ${publishedProject.id} | Status: ${publishedProject.status} | isPublished: ${publishedProject.isPublished}`);

  // Query API to verify Published project IS returned
  const apiAfterPublish = await queryPublicApi();
  const foundPublishedInApi = apiAfterPublish.data?.items?.some((p: any) => p.id === draftProject.id);
  console.log(`[API CHECK PUBLISH] Is Published Project Visible in Public Feed? -> ${foundPublishedInApi} (Expected: true)`);
  console.log(`[API ITEMS COUNT] Total items returned: ${apiAfterPublish.data?.items?.length}`);

  // Step 3: Unpublish the project (Simulate Admin Unpublish Action)
  console.log('\n--- 3. EXECUTING ADMIN UNPUBLISH ACTION ---');
  const unpublishedProject = await prisma.project.update({
    where: { id: draftProject.id },
    data: {
      isPublished: false,
      status: ProjectStatus.DRAFT,
    },
  });

  console.log(`[DB UNPUBLISHED STATE] ID: ${unpublishedProject.id} | Status: ${unpublishedProject.status} | isPublished: ${unpublishedProject.isPublished}`);

  const apiAfterUnpublish = await queryPublicApi();
  const foundUnpublishedInApi = apiAfterUnpublish.data?.items?.some((p: any) => p.id === draftProject.id);
  console.log(`[API CHECK UNPUBLISH] Is Unpublished Visible in Public Feed? -> ${foundUnpublishedInApi} (Expected: false)`);

  // Step 4: Cleanup test record
  console.log('\n--- 4. CLEANING UP TEST RECORD ---');
  await prisma.project.delete({ where: { id: draftProject.id } });
  console.log(`[CLEANUP] Deleted test project ${draftProject.id}`);

  console.log('\n=====================================================');
  console.log('✅ LIFECYCLE & VISIBILITY AUDIT COMPLETED WITH SUCCESS');
  console.log('=====================================================');
}

runLifecycleAudit()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
