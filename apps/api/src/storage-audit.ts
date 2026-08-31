import { PrismaClient, ProjectStatus, ProjectCategory, ProjectImageType } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
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

async function runStorageConsistencyAudit() {
  console.log('=====================================================');
  console.log('📊 MASAJID DATABASE & SUPABASE STORAGE AUDIT');
  console.log('=====================================================');

  // 1. Projects Count
  const projectsCount = await prisma.project.count();
  console.log(`[DB] Total Projects: ${projectsCount}`);

  // 2. Images Count in Database
  const images = await prisma.projectImage.findMany({
    select: { storageKey: true, url: true, projectId: true },
  });
  console.log(`[DB] Total Project Images Tracked: ${images.length}`);

// 3. List Storage Bucket Objects via Supabase Storage REST API
  if (supabaseUrl && supabaseKey) {
    try {
      const res = await fetch(`${supabaseUrl}/storage/v1/object/list/${bucketName}`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prefix: 'media',
          limit: 100,
        }),
      });

      if (!res.ok) {
        console.error(`[STORAGE] Error listing bucket: ${res.status} ${res.statusText}`);
      } else {
        const files: any = await res.json();
        console.log(`[STORAGE] Total files in '${bucketName}/media': ${files?.length || 0}`);
        
        const dbStorageKeys = new Set(images.map(img => img.storageKey).filter(Boolean));
        let matched = 0;
        let orphans = 0;

        files?.forEach((file: any) => {
          const fullKey = `media/${file.name}`;
          if (dbStorageKeys.has(fullKey)) {
            matched++;
          } else {
            orphans++;
          }
        });

        console.log(`[STORAGE CONSISTENCY] Matched Active DB Files: ${matched} | Orphaned/Historical Files: ${orphans}`);
      }
    } catch (e: any) {
      console.error(`[STORAGE] Exception: ${e.message}`);
    }
  } else {
    console.log('[STORAGE] Supabase credentials not configured in local environment');
  }

  console.log('=====================================================');
}

runStorageConsistencyAudit()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
