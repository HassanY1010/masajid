import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import { ProjectCategory } from '@masajid/shared-types';
import {
  Building2,
  MapPin,
  FileText,
  DollarSign,
  Image as ImageIcon,
  Save,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export const ProjectFormPage: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    title: string;
    mosqueName: string;
    governorate: string;
    district: string;
    locationText: string;
    description: string;
    needDescription: string;
    category: ProjectCategory;
    estimatedCost: number;
    currency: string;
    totalShares: number;
    shareValue: number;
    coverUrl: string;
  }>({
    title: '',
    mosqueName: '',
    governorate: '',
    district: '',
    locationText: '',
    description: '',
    needDescription: '',
    category: ProjectCategory.MAINTENANCE,
    estimatedCost: 20000,
    currency: 'SAR',
    totalShares: 2000,
    shareValue: 10,
    coverUrl: '',
  });

  // Calculate live invariant
  const totalSharesValue = formData.totalShares * formData.shareValue;
  const isMathValid = Math.abs(totalSharesValue - formData.estimatedCost) < 0.01;

  const mutation = useMutation({
    mutationFn: (payload: any) => api.post('/admin/projects', payload),
    onSuccess: () => {
      navigate('/projects');
    },
    onError: (err: any) => {
      setError(err.message || 'حدث خطأ أثناء حفظ المشروع');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isMathValid) {
      setError(`خطأ رياضي: عدد الأسهم (${formData.totalShares}) × قيمة السهم (${formData.shareValue}) = ${totalSharesValue} لا يتطابق مع التكلفة المقدرة (${formData.estimatedCost})`);
      return;
    }

    const payload = {
      ...formData,
      images: formData.coverUrl
        ? [
            {
              url: formData.coverUrl,
              storageKey: 'manual_cover',
              type: 'COVER',
              sortOrder: 0,
            },
          ]
        : [],
    };

    mutation.mutate(payload);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">إضافة مشروع مسجد جديد</h1>
        <p className="text-sm text-slate-400 mt-1">
          أدخل بيانات المسجد، الموقع الجغرافي، الاحتياج الفني، وهيكل الأسهم التمويلية
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-400 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Mosque & General Info */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-brand-400 font-bold text-base">
            <Building2 className="w-5 h-5" />
            <span>بيانات المسجد والمشروع</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                عنوان المشروع التمويلي <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="مثال: توريد وتركيب منظومة طاقة شمسية"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                اسم المسجد أو الجامع <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="مثال: مسجد التقوى"
                value={formData.mosqueName}
                onChange={(e) => setFormData({ ...formData, mosqueName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              فئة احتياج المسجد <span className="text-rose-400">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as ProjectCategory })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-brand-500 focus:outline-none"
            >
              <option value={ProjectCategory.SOLAR}>طاقة شمسية وكهرباء بديلة</option>
              <option value={ProjectCategory.WATER}>شبكة مياه وحفر آبار وسقيا</option>
              <option value={ProjectCategory.MAINTENANCE}>صيانة وترميم عام</option>
              <option value={ProjectCategory.FURNISHING}>فرش سجاد وتجهيز صوتيات</option>
              <option value={ProjectCategory.CONSTRUCTION}>بناء وتوسعة المسجد</option>
              <option value={ProjectCategory.CLEANING}>نظافة وتعقيم دورات المياه</option>
              <option value={ProjectCategory.QURAN_SUPPLIES}>مصاحف ودواليب ومستلزمات</option>
            </select>
          </div>
        </div>

        {/* Section 2: Location */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-brand-400 font-bold text-base">
            <MapPin className="w-5 h-5" />
            <span>الموقع الجغرافي للمسجد</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                المحافظة <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="مثال: حضرموت"
                value={formData.governorate}
                onChange={(e) => setFormData({ ...formData, governorate: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                المديرية / المنطقة <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="مثال: غيل باوزير"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              الوصف التفصيلي لموقع المسجد <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="مثال: حي السلام - بجانب مدرسة الأمل الأساسية"
              value={formData.locationText}
              onChange={(e) => setFormData({ ...formData, locationText: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Section 3: Financial Structure & Shares */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-brand-400 font-bold text-base">
            <DollarSign className="w-5 h-5" />
            <span>الهيكل المالي ونظام الأسهم</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                التكلفة الإجمالية للمشروع <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                value={formData.estimatedCost}
                onChange={(e) => setFormData({ ...formData, estimatedCost: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                قيمة السهم الواحد (SAR) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                value={formData.shareValue}
                onChange={(e) => {
                  const sVal = Number(e.target.value);
                  const newShares = sVal > 0 ? Math.floor(formData.estimatedCost / sVal) : formData.totalShares;
                  setFormData({ ...formData, shareValue: sVal, totalShares: newShares });
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                إجمالي عدد الأسهم <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                value={formData.totalShares}
                onChange={(e) => setFormData({ ...formData, totalShares: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Mathematical Invariant Verification Box */}
          <div className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
            isMathValid
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}>
            <div>
              <p className="font-bold">
                المعادلة: {formData.totalShares} سهم × {formData.shareValue} SAR = {totalSharesValue.toLocaleString()} SAR
              </p>
              <p className="text-[11px] opacity-80 mt-0.5">
                {isMathValid ? 'الحسابات متطابقة تماماً مع التكلفة المقدرة' : 'تحذير: حاصل ضرب الأسهم لا يساوي التكلفة المقدرة!'}
              </p>
            </div>
            <span className="font-black text-sm">
              {isMathValid ? '✓ سليم' : '✗ غير متطابق'}
            </span>
          </div>
        </div>

        {/* Section 4: Descriptions & Image */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-brand-400 font-bold text-base">
            <FileText className="w-5 h-5" />
            <span>تفاصيل الاحتياج والصور</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              وصف المشروع العام للزوار <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={3}
              required
              placeholder="اكتب نبذة عن حاجة المسجد وأهمية هذا المشروع للمصلين..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-brand-500 focus:outline-none"
            ></textarea>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              الوصف الفني للمواصفات والأجهزة المطلوبة <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={2}
              required
              placeholder="مثال: تركيب 16 لوح طاقة 550 واط، 4 بطاريات ليثيوم 48V، ومحول هجين 10KW..."
              value={formData.needDescription}
              onChange={(e) => setFormData({ ...formData, needDescription: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-brand-500 focus:outline-none"
            ></textarea>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              رابط صورة غلاف المسجد (Cover Image URL)
            </label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={formData.coverUrl}
              onChange={(e) => setFormData({ ...formData, coverUrl: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/projects')}
            className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={mutation.isPending || !isMathValid}
            className="px-8 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold shadow-lg shadow-brand-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>جاري الحفظ...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>حفظ المشروع كمسودة</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
