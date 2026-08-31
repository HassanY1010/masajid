import { PrismaClient } from '@prisma/client';
import * as http from 'http';
import * as https from 'https';

const prisma = new PrismaClient();

function fetchUrl(urlStr: string, headers: Record<string, string> = {}): Promise<{ size: number; status: number; data: string; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const client = parsed.protocol === 'https:' ? https : http;
    const req = client.get(urlStr, { headers }, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        resolve({
          size: Buffer.byteLength(body),
          status: res.statusCode || 0,
          data: body,
          headers: res.headers,
        });
      });
    });
    req.on('error', reject);
  });
}

function getHeaderLength(urlStr: string): Promise<{ length: number; cacheControl: string; contentType: string }> {
  return new Promise((resolve) => {
    const parsed = new URL(urlStr);
    const client = parsed.protocol === 'https:' ? https : http;
    const req = client.request(urlStr, { method: 'HEAD' }, (res) => {
      const len = parseInt(res.headers['content-length'] || '0', 10);
      const cc = (res.headers['cache-control'] as string) || '';
      const ct = (res.headers['content-type'] as string) || '';
      resolve({ length: len, cacheControl: cc, contentType: ct });
    });
    req.on('error', () => resolve({ length: 0, cacheControl: '', contentType: '' }));
    req.end();
  });
}

async function runFinalAudit() {
  console.log('--- EXECUTING FINAL BANDWIDTH & CACHED EGRESS MEASUREMENT ---');

  const projects = await prisma.project.findMany({
    include: { images: true, updates: true, contributions: true },
  });

  const totalProjects = projects.length;
  let totalImages = 0;
  let totalStoredImageBytes = 0;
  const imageMeasurements: any[] = [];

  for (const p of projects) {
    totalImages += p.images.length;
    for (const img of p.images) {
      const { length, cacheControl, contentType } = await getHeaderLength(img.url);
      totalStoredImageBytes += length;
      imageMeasurements.push({
        url: img.url,
        sizeBytes: length,
        type: img.type,
        contentType,
        cacheControl,
      });
    }
  }

  // Measure API response sizes with and without Gzip
  const apiBase = process.env.BACKEND_API_URL || 'https://masajid-1ggr.onrender.com/api';
  let uncompressedListSize = 0;
  let compressedListSize = 0;
  let uncompressedSingleSize = 0;
  let bankAccountsSize = 0;

  try {
    const resRaw = await fetchUrl(`${apiBase}/projects`);
    uncompressedListSize = resRaw.size;

    const resGzip = await fetchUrl(`${apiBase}/projects`, { 'Accept-Encoding': 'gzip' });
    compressedListSize = resGzip.size;
  } catch (e) {}

  if (projects.length > 0) {
    try {
      const resSingle = await fetchUrl(`${apiBase}/projects/${projects[0].id}`);
      uncompressedSingleSize = resSingle.size;
    } catch (e) {}
  }

  try {
    const resBanks = await fetchUrl(`${apiBase}/bank-accounts`);
    bankAccountsSize = resBanks.size;
  } catch (e) {}

  console.log('AUDIT_TOTAL_PROJECTS:', totalProjects);
  console.log('AUDIT_TOTAL_IMAGES:', totalImages);
  console.log('AUDIT_TOTAL_STORED_IMAGE_BYTES:', totalStoredImageBytes);
  console.log('AUDIT_IMAGE_DETAILS:', JSON.stringify(imageMeasurements, null, 2));
  console.log('AUDIT_API_PROJECTS_UNCOMPRESSED_BYTES:', uncompressedListSize);
  console.log('AUDIT_API_PROJECTS_GZIP_BYTES:', compressedListSize);
  console.log('AUDIT_API_SINGLE_PROJECT_BYTES:', uncompressedSingleSize);
  console.log('AUDIT_API_BANK_ACCOUNTS_BYTES:', bankAccountsSize);
}

runFinalAudit()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
