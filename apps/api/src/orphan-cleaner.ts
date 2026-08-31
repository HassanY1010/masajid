import { PrismaClient, ProjectStatus, ProjectCategory, ProjectImageType } from '@prisma/client';
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

async function runOrphanCleanup() {
  console.log('=====================================================');
  console.log('🧹 RUNNING ORPHAN STORAGE CLEANUP FOR MASAJID');
  console.log('=====================================================');

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase credentials missing.');
    return;
  }

  // 1. Fetch active DB storage keys
  const images = await prisma.projectImage.findMany({ select: { storageKey: true } });
  const activeKeys = new Set(images.map((img) => img.storageKey).filter(Boolean));

  // 2. Fetch bucket files
  const res = await fetch(`${supabaseUrl}/storage/v1/object/list/${bucketName}`, {
    method: 'POST',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prefix: 'media', limit: 100 }),
  });

  const files: any = await res.json();
  const orphanKeys: string[] = [];

  files?.forEach((file: any) => {
    const fullKey = `media/${file.name}`;
    if (!activeKeys.has(fullKey)) {
      orphanKeys.push(fullKey);
    }
  });

  console.log(`[ORPHANS DETECTED] Found ${orphanKeys.length} orphan files in Supabase Storage.`);

  if (orphanKeys.length > 0) {
    console.log(`[DELETING ORPHANS] ${JSON.stringify(orphanKeys)}`);
    const deleteRes = await fetch(`${supabaseUrl}/storage/v1/object/${bucketName}`, {
      method: 'DELETE',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prefixes: orphanKeys }),
    });

    if (deleteRes.ok) {
      console.log(`✅ Successfully purged ${orphanKeys.length} orphan files from Supabase Storage.`);
    } else {
      console.error(`❌ Failed to purge orphans: ${deleteRes.status}`);
    }
  }

  console.log('=====================================================');
}

runOrphanCleanup()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
