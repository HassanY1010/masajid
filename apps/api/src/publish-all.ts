import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.project.updateMany({
    data: {
      isPublished: true,
      status: 'FUNDING',
    },
  });
  console.log('✅ Updated all existing projects to Published & Funding:', result);

  const projects = await prisma.project.findMany({
    include: { images: true },
  });
  console.log(`📊 Total projects in database: ${projects.length}`);
  projects.forEach((p) => {
    console.log(` - [${p.id}] ${p.title} (${p.mosqueName}) | Status: ${p.status} | Published: ${p.isPublished} | Images: ${p.images.length}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
