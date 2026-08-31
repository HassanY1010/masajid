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

function getHeaderLength(urlStr: string): Promise<{ length: number; cacheControl: string }> {
  return new Promise((resolve) => {
    const parsed = new URL(urlStr);
    const client = parsed.protocol === 'https:' ? https : http;
    const req = client.request(urlStr, { method: 'HEAD' }, (res) => {
      const len = parseInt(res.headers['content-length'] || '0', 10);
      const cc = res.headers['cache-control'] || '';
      resolve({ length: len, cacheControl: cc });
    });
    req.on('error', () => resolve({ length: 0, cacheControl: '' }));
    req.end();
  });
}

async function measureAfter() {
  console.log('--- STARTING BANDWIDTH AFTER-OPTIMIZATION MEASUREMENT ---');

  const projects = await prisma.project.findMany({
    include: { images: true, updates: true, contributions: true },
  });

  const totalProjects = projects.length;
  let totalImages = 0;
  const imageMeasurements: any[] = [];

  for (const p of projects) {
    totalImages += p.images.length;
    for (const img of p.images) {
      const { length, cacheControl } = await getHeaderLength(img.url);
      imageMeasurements.push({
        url: img.url,
        sizeBytes: length,
        type: img.type,
        cacheControl,
      });
    }
  }

  // Measure API response sizes with and without Gzip
  const apiBase = process.env.BACKEND_API_URL || 'https://masajid-1ggr.onrender.com/api';
  let rawListSize = 0;
  let rawSingleSize = 0;
  let rawBanksSize = 0;

  try {
    const resList = await fetchUrl(`${apiBase}/projects`);
    rawListSize = resList.size;
  } catch (e) {}

  if (projects.length > 0) {
    try {
      const resSingle = await fetchUrl(`${apiBase}/projects/${projects[0].id}`);
      rawSingleSize = resSingle.size;
    } catch (e) {}
  }

  try {
    const resBanks = await fetchUrl(`${apiBase}/bank-accounts`);
    rawBanksSize = resBanks.size;
  } catch (e) {}

  console.log('TOTAL_PROJECTS:', totalProjects);
  console.log('TOTAL_PROJECT_IMAGES:', totalImages);
  console.log('MEASURED_IMAGE_ASSETS:', JSON.stringify(imageMeasurements, null, 2));
  console.log('API_PROJECTS_LIST_SIZE_BYTES:', rawListSize);
  console.log('API_SINGLE_PROJECT_SIZE_BYTES:', rawSingleSize);
  console.log('API_BANK_ACCOUNTS_SIZE_BYTES:', rawBanksSize);
}

measureAfter()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
