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
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const bucketName = process.env.SUPABASE_BUCKET || 'masajid-uploads';

// Parse command-line flags
const isDryRun = process.argv.includes('--dry-run');
const graceArg = process.argv.find((a) => a.startsWith('--grace='));
const gracePeriodMinutes = graceArg ? parseInt(graceArg.split('=')[1], 10) : 60;

async function runOrphanCleanupCLI() {
  console.log('================================================================');
  console.log(`🧹 MASAJID SUPABASE ORPHAN CLEANUP (${isDryRun ? 'DRY-RUN MODE' : 'LIVE PURGE MODE'})`);
  console.log(`⏱️  Grace Period: ${gracePeriodMinutes} minutes (Recent files protected)`);
  console.log('================================================================');

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase credentials missing.');
    return;
  }

  // 1. Fetch active DB storage keys
  const [images, contributions] = await Promise.all([
    prisma.projectImage.findMany({ select: { storageKey: true } }),
    prisma.contribution.findMany({ select: { receiptStorageKey: true } }),
  ]);

  const activeKeys = new Set<string>();
  images.forEach((img) => img.storageKey && activeKeys.add(img.storageKey));
  contributions.forEach((c) => c.receiptStorageKey && activeKeys.add(c.receiptStorageKey));

  console.log(`[DB SCAN] Active Referenced Storage Keys: ${activeKeys.size}`);

  // 2. Fetch bucket files
  const res = await fetch(`${supabaseUrl}/storage/v1/object/list/${bucketName}`, {
    method: 'POST',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prefix: 'media', limit: 500 }),
  });

  if (!res.ok) {
    console.error(`❌ Failed to list bucket: ${res.status} ${res.statusText}`);
    return;
  }

  const files: any = await res.json();
  const graceCutoff = Date.now() - gracePeriodMinutes * 60 * 1000;
  const orphanKeys: string[] = [];
  let protectedCount = 0;

  files?.forEach((file: any) => {
    const fullKey = `media/${file.name}`;
    if (!activeKeys.has(fullKey)) {
      // Check timestamp prefix for grace period
      const match = file.name.match(/^(\d+)-/);
      if (match && match[1]) {
        const uploadTime = parseInt(match[1], 10);
        if (uploadTime > graceCutoff) {
          protectedCount++;
          console.log(`[PROTECTED RECENT FILE] '${fullKey}' uploaded within last ${gracePeriodMinutes}m -> SKIPPED`);
          return;
        }
      }
      orphanKeys.push(fullKey);
    }
  });

  console.log(`[SCAN RESULT] Total Files in Storage: ${files.length}`);
  console.log(`[SCAN RESULT] Active DB Files: ${files.length - orphanKeys.length - protectedCount}`);
  console.log(`[SCAN RESULT] Protected Recent Uploads: ${protectedCount}`);
  console.log(`[SCAN RESULT] Orphan Candidates for Deletion: ${orphanKeys.length}`);

  if (orphanKeys.length > 0) {
    if (isDryRun) {
      console.log(`\n🔍 [DRY-RUN] Would delete ${orphanKeys.length} files:`);
      orphanKeys.forEach((k) => console.log(`   - ${k}`));
      console.log('✅ DRY-RUN Completed. No files were deleted.');
    } else {
      console.log(`\n🗑️ [LIVE PURGE] Deleting ${orphanKeys.length} orphan files from Supabase...`);
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
        console.log(`✅ Successfully purged ${orphanKeys.length} orphan files.`);
      } else {
        console.error(`❌ Deletion failed: ${deleteRes.status}`);
      }
    }
  } else {
    console.log('✨ Storage is completely clean! Zero orphan files found.');
  }

  console.log('================================================================');
}

runOrphanCleanupCLI()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
