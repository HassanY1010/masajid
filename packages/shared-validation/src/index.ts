import { z } from 'zod';
import { ProjectCategory, ProjectStatus, ProjectImageType } from '@masajid/shared-types';

export const LoginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(6, 'كلمة المرور يجب أن لا تقل عن 6 خانات'),
});

export const ProjectValidation = {
  create: z.object({
    title: z.string().min(3, 'عنوان المشروع مطلوب'),
    mosqueName: z.string().min(3, 'اسم المسجد مطلوب'),
    governorate: z.string().min(2, 'المحافظة مطلوبة'),
    district: z.string().min(2, 'المديرية مطلوبة'),
    locationText: z.string().min(3, 'وصف الموقع مطلوب'),
    latitude: z.number().optional().nullable(),
    longitude: z.number().optional().nullable(),
    description: z.string().min(10, 'وصف المشروع مطلوب'),
    needDescription: z.string().min(5, 'وصف الاحتياج مطلوب'),
    category: z.nativeEnum(ProjectCategory, { errorMap: () => ({ message: 'فئة المشروع غير صالحة' }) }),
    estimatedCost: z.number().positive('التكلفة المقدرة يجب أن تكون أكبر من صفر'),
    currency: z.string().default('SAR'),
    totalShares: z.number().int().positive('عدد الأسهم يجب أن يكون أكبر من صفر'),
    shareValue: z.number().positive('قيمة السهم يجب أن تكون أكبر من صفر'),
  }).refine((data) => Math.abs(data.totalShares * data.shareValue - data.estimatedCost) < 0.01, {
    message: 'إجمالي الأسهم مضروباً بقيمة السهم يجب أن يساوي التكلفة التقديرية (totalShares * shareValue == estimatedCost)',
    path: ['totalShares'],
  }),
};

export const ContributionValidation = {
  create: z.object({
    projectId: z.string().uuid('معرف المشروع غير صحيح'),
    amount: z.number().positive('المبلغ يجب أن يكون أكبر من صفر'),
    currency: z.string().default('SAR'),
    paymentMethod: z.string().optional().nullable(),
    donorName: z.string().optional().nullable(),
    donorPhone: z.string().optional().nullable(),
  }),
};

export const BankAccountValidation = {
  createOrUpdate: z.object({
    name: z.string().min(2, 'اسم البنك مطلوب'),
    displayName: z.string().min(2, 'الاسم المعروض مطلوب'),
    accountName: z.string().min(2, 'اسم صاحب الحساب مطلوب'),
    accountNumber: z.string().min(3, 'رقم الحساب مطلوب'),
    iban: z.string().optional().nullable(),
    currency: z.string().default('SAR'),
    logoUrl: z.string().optional().nullable(),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().default(0),
  }),
};

// Helper calculation functions
export function calculateShares(amount: number, shareValue: number): { isValid: boolean; shares: number; error?: string } {
  if (shareValue <= 0) return { isValid: false, shares: 0, error: 'قيمة السهم غير صالحة' };
  if (amount <= 0) return { isValid: false, shares: 0, error: 'المبلغ يجب أن يكون أكبر من صفر' };

  const shares = amount / shareValue;
  if (!Number.isInteger(shares)) {
    return {
      isValid: false,
      shares: 0,
      error: `المبلغ يجب أن يكون من مضاعفات قيمة السهم (${shareValue})`,
    };
  }

  return { isValid: true, shares };
}
