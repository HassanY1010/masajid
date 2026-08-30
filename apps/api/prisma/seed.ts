import { PrismaClient, ProjectCategory, ProjectStatus, ProjectImageType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Seed Admin
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@masajid.app';
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPassword123!';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.admin.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      name: process.env.ADMIN_NAME || 'مدير المنصة',
    },
    create: {
      email: adminEmail,
      name: process.env.ADMIN_NAME || 'مدير المنصة',
      passwordHash,
      isActive: true,
    },
  });

  console.log(`👤 Admin configured: ${admin.email}`);

  // 2. Seed Bank Accounts
  const bankAccounts = [
    {
      name: 'AlAmqi',
      displayName: 'شركة العمقي وإخوانه للصرافة',
      accountName: 'مشروع مساجد لخدمة بيوت الله',
      accountNumber: '254019283',
      iban: 'YE00AMQI254019283001',
      currency: 'SAR',
      sortOrder: 1,
    },
    {
      name: 'AlBaseeri',
      displayName: 'شركة البسيري للصرافة',
      accountName: 'مشروع مساجد لخدمة بيوت الله',
      accountNumber: '110293847',
      iban: 'YE00BSRI110293847002',
      currency: 'SAR',
      sortOrder: 2,
    },
    {
      name: 'AlKuraimi',
      displayName: 'بنك الكريمي للتمويل الأصغر الإسلامي',
      accountName: 'مشروع مساجد لخدمة بيوت الله',
      accountNumber: '304928174',
      iban: 'YE00KURI304928174003',
      currency: 'SAR',
      sortOrder: 3,
    },
    {
      name: 'Bandal',
      displayName: 'شبكة بندل للحوالات السريعة',
      accountName: 'مشروع مساجد لخدمة بيوت الله',
      accountNumber: '99201824',
      iban: null,
      currency: 'SAR',
      sortOrder: 4,
    },
  ];

  for (const acc of bankAccounts) {
    const existing = await prisma.bankAccount.findFirst({ where: { name: acc.name } });
    if (!existing) {
      await prisma.bankAccount.create({ data: acc });
    }
  }
  console.log('🏦 Bank accounts seeded');

  // 3. Seed Sample Mosque Projects
  const sampleProjects = [
    {
      title: 'منظومة طاقة شمسية متكاملة للمسجد',
      mosqueName: 'مسجد التقوى',
      governorate: 'حضرموت',
      district: 'غيل باوزير',
      locationText: 'حي السلام - بجانب المدرسة الأساسية',
      latitude: 14.7785,
      longitude: 49.3683,
      description: 'يحتاج مسجد التقوى إلى منظومة طاقة شمسية بطاقة 10 كيلوواط لتشغيل المكيفات والإنارة أثناء انقطاع التيار الكهربائي المتكرر في فصل الصيف، للتخفيف عن المصلين.',
      needDescription: 'تركيب 16 لوح طاقة شمسية، 4 بطاريات ليثيوم، ومحول طاقة هجين عالي الكفاءة.',
      category: ProjectCategory.SOLAR,
      estimatedCost: 20000,
      currency: 'SAR',
      totalShares: 2000,
      shareValue: 10,
      fundedShares: 1600,
      fundedAmount: 16000,
      status: ProjectStatus.FUNDING,
      isPublished: true,
      publishedAt: new Date(),
      images: [
        {
          url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
          storageKey: 'sample/mosque1.jpg',
          type: ProjectImageType.COVER,
          sortOrder: 0,
        },
        {
          url: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=1200&q=80',
          storageKey: 'sample/mosque1_inner.jpg',
          type: ProjectImageType.GALLERY,
          sortOrder: 1,
        }
      ],
      updates: [
        {
          title: 'استلام عروض الأسعار من الموردين',
          description: 'تم فحص عروض الأسعار المقدمة من 3 شركات متخصصة واختيار العرض الأفضل جودة وضماناً لمدة 5 سنوات.',
          images: [],
        }
      ]
    },
    {
      title: 'تأهيل شبكة المياه وحفر بئر ارتوازي للمسجد',
      mosqueName: 'جامع النور الكبير',
      governorate: 'شبوة',
      district: 'عتق',
      locationText: 'شارع المحافظة العام',
      latitude: 14.5372,
      longitude: 46.8319,
      description: 'يعاني الجامع من انقطاع دائم للمياه مما يؤثر على أماكن الوضوء ودورات المياه، ويهدف المشروع لحفر بئر ارتوازي وتركيب مضخة وخزانات سعة 10,000 لتر.',
      needDescription: 'حفر بئر وتمديد أنابيب مياه مع خزانات فيبر جلاس ومضخة غاطسة.',
      category: ProjectCategory.WATER,
      estimatedCost: 35000,
      currency: 'SAR',
      totalShares: 700,
      shareValue: 50,
      fundedShares: 700,
      fundedAmount: 35000,
      status: ProjectStatus.FULLY_FUNDED,
      isPublished: true,
      publishedAt: new Date(),
      images: [
        {
          url: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=1200&q=80',
          storageKey: 'sample/mosque2.jpg',
          type: ProjectImageType.COVER,
          sortOrder: 0,
        }
      ]
    },
    {
      title: 'صيانة وترميم سقف المسجد والتمديدات الكهربائية',
      mosqueName: 'مسجد الإحسان',
      governorate: 'عدن',
      district: 'المنصورة',
      locationText: 'حي كابوتا - جوار الحديقة',
      latitude: 12.8628,
      longitude: 44.9754,
      description: 'ترميم الشقوق الخرسانية في السقف لمنع تسرب مياه الأمطار وتجديد كامل لشبكة الكهرباء والإنارة المتهالكة.',
      needDescription: 'عزل مائي وحراري للسقف واستبدال لوحات التوزيع والإنارة بـ LED موفرة.',
      category: ProjectCategory.MAINTENANCE,
      estimatedCost: 15000,
      currency: 'SAR',
      totalShares: 1500,
      shareValue: 10,
      fundedShares: 450,
      fundedAmount: 4500,
      status: ProjectStatus.FUNDING,
      isPublished: true,
      publishedAt: new Date(),
      images: [
        {
          url: 'https://images.unsplash.com/photo-1590076215667-875d4ef2d7ee?auto=format&fit=crop&w=1200&q=80',
          storageKey: 'sample/mosque3.jpg',
          type: ProjectImageType.COVER,
          sortOrder: 0,
        }
      ]
    },
    {
      title: 'فرش المسجد بسجاد فاخر وتجهيز نظام صوتيات حديث',
      mosqueName: 'مسجد الروضة',
      governorate: 'مأرب',
      district: 'المدينة',
      locationText: 'حي الروضة الشمالي',
      latitude: 15.4542,
      longitude: 45.3283,
      description: 'فرش المسجد بسجاد تركي عالي الكثافة ومقاوم للاستخدام الكثيف بمساحة 400 متر مربع مع تركيب نظام صوتيات متطور.',
      needDescription: '400 متر مربع سجاد صلاة مع 4 سماعات جدارية وميكروفونات لاسلكية نقية.',
      category: ProjectCategory.FURNISHING,
      estimatedCost: 24000,
      currency: 'SAR',
      totalShares: 1200,
      shareValue: 20,
      fundedShares: 120,
      fundedAmount: 2400,
      status: ProjectStatus.FUNDING,
      isPublished: true,
      publishedAt: new Date(),
      images: [
        {
          url: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=1200&q=80',
          storageKey: 'sample/mosque4.jpg',
          type: ProjectImageType.COVER,
          sortOrder: 0,
        }
      ]
    }
  ];

  for (const proj of sampleProjects) {
    const { images, updates, ...projData } = proj;
    const existing = await prisma.project.findFirst({ where: { mosqueName: projData.mosqueName, title: projData.title } });
    if (!existing) {
      const created = await prisma.project.create({
        data: {
          ...projData,
          images: {
            create: images,
          },
          updates: {
            create: updates || [],
          },
        },
      });

      // Add a sample pending contribution for testing workflow
      if (projData.status === ProjectStatus.FUNDING) {
        await prisma.contribution.create({
          data: {
            projectId: created.id,
            amount: 200,
            currency: 'SAR',
            shares: 200 / projData.shareValue,
            donorName: 'فاعل خير',
            donorPhone: '966500000000',
            paymentMethod: 'AlAmqi',
            receiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
            receiptStorageKey: 'sample/receipt1.jpg',
            status: 'PENDING',
          },
        });
      }
    }
  }

  console.log('🕌 Sample projects & test contributions created');
  console.log('✅ Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
