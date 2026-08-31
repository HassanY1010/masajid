import { PrismaClient } from '@prisma/client';
import * as http from 'http';
import * as https from 'https';

const prisma = new PrismaClient();

function fetchUrl(urlStr: string): Promise<{ size: number; status: number; data: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const client = parsed.protocol === 'https:' ? https : http;
    const req = client.get(urlStr, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        resolve({
          size: Buffer.byteLength(body),
          status: res.statusCode || 0,
          data: body,
        });
      });
    });
    req.on('error', reject);
  });
}

function getHeaderLength(urlStr: string): Promise<number> {
  return new Promise((resolve) => {
    const parsed = new URL(urlStr);
    const client = parsed.protocol === 'https:' ? https : http;
    const req = client.request(urlStr, { method: 'HEAD' }, (res) => {
      const len = parseInt(res.headers['content-length'] || '0', 10);
      resolve(len);
    });
    req.on('error', () => resolve(0));
    req.end();
  });
}

async function measure() {
  console.log('--- STARTING BANDWIDTH BASELINE MEASUREMENT ---');

  const projects = await prisma.project.findMany({
    include: { images: true, updates: true, contributions: true },
  });

  const totalProjects = projects.length;
  let totalImages = 0;
  const imageSizes: { url: string; sizeBytes: number; type: string }[] = [];

  for (const p of projects) {
    totalImages += p.images.length;
    for (const img of p.images) {
      const len = await getHeaderLength(img.url);
      imageSizes.push({ url: img.url, sizeBytes: len, type: img.type });
    }
  }

  // Measure API response sizes
  const apiBase = process.env.BACKEND_API_URL || 'https://masajid-1ggr.onrender.com/api';
  let publicProjectsSize = 0;
  let singleProjectSize = 0;
  let bankAccountsSize = 0;

  try {
    const resList = await fetchUrl(`${apiBase}/projects`);
    publicProjectsSize = resList.size;
  } catch (e) {}

  if (projects.length > 0) {
    try {
      const resSingle = await fetchUrl(`${apiBase}/projects/${projects[0].id}`);
      singleProjectSize = resSingle.size;
    } catch (e) {}
  }

  try {
    const resBanks = await fetchUrl(`${apiBase}/bank-accounts`);
    bankAccountsSize = resBanks.size;
  } catch (e) {}

  console.log('TOTAL_PROJECTS:', totalProjects);
  console.log('TOTAL_PROJECT_IMAGES:', totalImages);
  console.log('IMAGE_SIZES_MEASURED:', JSON.stringify(imageSizes, null, 2));
  console.log('API_PROJECTS_LIST_SIZE_BYTES:', publicProjectsSize);
  console.log('API_SINGLE_PROJECT_SIZE_BYTES:', singleProjectSize);
  console.log('API_BANK_ACCOUNTS_SIZE_BYTES:', bankAccountsSize);
}

measure()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
