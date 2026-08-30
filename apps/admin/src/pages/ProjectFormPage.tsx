import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import { ProjectCategory } from '@masajid/shared-types';
import {
  Building2,
  MapPin,
  FileText,
  DollarSign,
  Upload,
  Save,
  Loader2,
  AlertCircle,
  X,
  CheckCircle2,
  Images,
  Star,
} from 'lucide-react';

interface UploadedImageItem {
  url: string;
  storageKey: string;
  isCover: boolean;
  name?: string;
}

export const ProjectFormPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImageItem[]>([]);

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
  });

  // Calculate live invariant
  const totalSharesValue = formData.totalShares * formData.shareValue;
  const isMathValid = Math.abs(totalSharesValue - formData.estimatedCost) < 0.01;

  // Handle multi-image file upload from device memory / gallery
  const handleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check max 10 images limit
    if (uploadedImages.length + files.length > 10) {
      setError('الحد الأقصى المسموح به هو 10 صور للمشروع الواحد');
      return;
    }

    setUploadingImage(true);
    setError(null);

    try {
      const uploadFormData = new FormData();
      for (let i = 0; i < files.length; i++) {
        uploadFormData.append('files', files[i]);
      }

      // Call backend multiple images endpoint
      const res: any = await api.post('/admin/uploads/images', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (Array.isArray(res)) {
        const newUploadedItems: UploadedImageItem[] = res.map((item: any, idx: number) => ({
          url: item.url,
          storageKey: item.storageKey || 'media/image.jpg',
          isCover: uploadedImages.length === 0 && idx === 0, // first image becomes default cover
          name: item.originalName,
        }));

        setUploadedImages((prev) => {
          const updated = [...prev, ...newUploadedItems];
          // Ensure at least one image is marked as cover
          if (!updated.some((img) => img.isCover) && updated.length > 0) {
            updated[0].isCover = true;
          }
          return updated;
        });
      }
    } catch (err: any) {
      setError(err.message || 'فشل رفع الصور إلى التخزين السحابي. يرجى المحاولة مرة أخرى.');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (indexToRemove: number) => {
    setUploadedImages((prev) => {
      const wasCover = prev[indexToRemove].isCover;
      const updated = prev.filter((_, idx) => idx !== indexToRemove);
      if (wasCover && updated.length > 0) {
        updated[0].isCover = true; // set new first image as cover
      }
      return updated;
    });
  };

  const setAsCover = (indexToCover: number) => {
    setUploadedImages((prev) =>
      prev.map((img, idx) => ({
        ...img,
        isCover: idx === indexToCover,
      })),
    );
  };

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
      setError(
        `خطأ رياضي: عدد الأسهم (${formData.totalShares}) × قيمة السهم (${formData.shareValue}) = ${totalSharesValue} لا يتطابق مع التكلفة المقدرة (${formData.estimatedCost})`,
      );
      return;
    }

    const payload = {
      ...formData,
      images: uploadedImages.map((img, index) => ({
        url: img.url,
        storageKey: img.storageKey,
        type: img.isCover ? 'COVER' : 'GALLERY',
        sortOrder: img.isCover ? 0 : index + 1,
      })),
    };

    mutation.mutate(payload);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">إضافة مشروع مسجد جديد</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
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
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
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
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
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
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
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
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
              isMathValid
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            <div>
              <p className="font-bold">
                المعادلة: {formData.totalShares} سهم × {formData.shareValue} SAR = {totalSharesValue.toLocaleString()} SAR
              </p>
              <p className="text-[11px] opacity-80 mt-0.5">
                {isMathValid
                  ? 'الحسابات متطابقة تماماً مع التكلفة المقدرة'
                  : 'تحذير: حاصل ضرب الأسهم لا يساوي التكلفة المقدرة!'}
              </p>
            </div>
            <span className="font-black text-sm">{isMathValid ? '✓ سليم' : '✗ غير متطابق'}</span>
          </div>
        </div>

        {/* Section 4: Descriptions & Multi-Image Gallery Upload */}
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-brand-400 font-bold text-base">
            <FileText className="w-5 h-5" />
            <span>تفاصيل الاحتياج ومعرض صور المسجد</span>
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

          {/* Multi-Image File Picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-300">
                معرض صور المسجد (يمكنك اختيار عدة صور معاً - حتى 10 صور)
              </label>
              <span className="text-xs text-brand-400 font-bold">
                {uploadedImages.length}/10 صور مرفوعة
              </span>
            </div>

            {/* Hidden native multi-file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFilesChange}
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
            />

            {/* Images Grid */}
            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                {uploadedImages.map((img, idx) => (
                  <div
                    key={idx}
                    className={`relative rounded-2xl overflow-hidden border bg-slate-950 group ${
                      img.isCover ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-slate-800'
                    }`}
                  >
                    <img src={img.url} alt="" className="w-full h-32 object-cover" />

                    {/* Cover Badge */}
                    {img.isCover && (
                      <div className="absolute top-2 right-2 bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 shadow-md">
                        <Star className="w-3 h-3 fill-slate-950" />
                        <span>صورة الغلاف</span>
                      </div>
                    )}

                    {/* Actions Overlay */}
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                      {!img.isCover && (
                        <button
                          type="button"
                          onClick={() => setAsCover(idx)}
                          className="px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold"
                          title="تعيين كصورة غلاف رئيسية"
                        >
                          تعيين كغلاف
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white"
                        title="حذف الصورة"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Trigger Area */}
            {uploadedImages.length < 10 && (
              <div
                onClick={() => !uploadingImage && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
                  uploadingImage
                    ? 'border-brand-500/50 bg-brand-500/5'
                    : 'border-slate-800 hover:border-brand-500/50 bg-slate-950/60 hover:bg-slate-950'
                }`}
              >
                {uploadingImage ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
                    <p className="text-xs text-brand-400 font-bold">
                      جاري رفع وتخزين الصور في التخزين السحابي...
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-brand-400 mb-3">
                      <Images className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-white text-center">
                      اضغط لتحديد صورة أو عدة صور من جهازك (Multi-select)
                    </p>
                    <p className="text-xs text-slate-500 mt-1 text-center">
                      اختر حتى 10 صور - أول صورة ستكون الغلاف تلقائياً ويمكنك تغييرها
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/projects')}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={mutation.isPending || !isMathValid || uploadingImage}
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>جاري الحفظ...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>حفظ المشروع ونشره</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
