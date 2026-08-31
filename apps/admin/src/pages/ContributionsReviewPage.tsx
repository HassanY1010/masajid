import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiClient } from '../lib/api';
import {
  HandCoins,
  CheckCircle2,
  XCircle,
  Eye,
  Building2,
  Calendar,
  DollarSign,
  AlertCircle,
  ExternalLink,
  Loader2,
  Download,
  X,
  Phone,
} from 'lucide-react';
import { ContributionStatus } from '@masajid/shared-types';

export const ContributionsReviewPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [rejectModalId, setRejectModalId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('سند التحويل غير واضح أو البيانات غير متطابقة');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-contributions', statusFilter],
    queryFn: () =>
      apiClient.get<any>('/admin/contributions', {
        params: { status: statusFilter || undefined },
      }),
    placeholderData: (previousData) => previousData,
  });

  const [actionError, setActionError] = useState<string | null>(null);

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/contributions/${id}/approve`),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['admin-contributions'] });

      const previousData = queryClient.getQueryData(['admin-contributions', statusFilter]);

      // Optimistically update contribution status to APPROVED in list (0ms UI latency)
      queryClient.setQueriesData({ queryKey: ['admin-contributions'] }, (old: any) => {
        if (!old || !Array.isArray(old.items)) return old;
        return {
          ...old,
          items: old.items.map((c: any) =>
            c.id === id ? { ...c, status: 'APPROVED', approvedAt: new Date().toISOString() } : c,
          ),
        };
      });

      return { previousData };
    },
    onSuccess: (updated: any) => {
      setActionError(null);
      // Update with exact server response
      if (updated?.id) {
        queryClient.setQueriesData({ queryKey: ['admin-contributions'] }, (old: any) => {
          if (!old || !Array.isArray(old.items)) return old;
          return {
            ...old,
            items: old.items.map((c: any) => (c.id === updated.id ? { ...c, ...updated } : c)),
          };
        });
      }
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
    },
    onError: (err: any, _id, context: any) => {
      if (context?.previousData) {
        queryClient.setQueryData(['admin-contributions', statusFilter], context.previousData);
      }
      setActionError(err.message || 'فشل قبول المساهمة');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.patch(`/admin/contributions/${id}/reject`, { reason }),
    onMutate: async ({ id, reason }) => {
      await queryClient.cancelQueries({ queryKey: ['admin-contributions'] });

      const previousData = queryClient.getQueryData(['admin-contributions', statusFilter]);

      // Optimistically update contribution status to REJECTED
      queryClient.setQueriesData({ queryKey: ['admin-contributions'] }, (old: any) => {
        if (!old || !Array.isArray(old.items)) return old;
        return {
          ...old,
          items: old.items.map((c: any) =>
            c.id === id ? { ...c, status: 'REJECTED', rejectionReason: reason } : c,
          ),
        };
      });

      setRejectModalId(null);
      return { previousData };
    },
    onSuccess: (updated: any) => {
      setActionError(null);
      if (updated?.id) {
        queryClient.setQueriesData({ queryKey: ['admin-contributions'] }, (old: any) => {
          if (!old || !Array.isArray(old.items)) return old;
          return {
            ...old,
            items: old.items.map((c: any) => (c.id === updated.id ? { ...c, ...updated } : c)),
          };
        });
      }
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (err: any, _vars, context: any) => {
      if (context?.previousData) {
        queryClient.setQueryData(['admin-contributions', statusFilter], context.previousData);
      }
      setActionError(err.message || 'فشل رفض المساهمة');
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">مراجعة المساهمات وسندات التحويل</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            تدقيق السندات البنكية المرفوعة، قبول الأسهم المساهم بها أو رفضها مع السبب
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap bg-slate-900 border border-slate-800 p-1.5 rounded-2xl gap-1 w-full sm:w-auto">
          {[
            { id: 'PENDING', label: 'قيد المراجعة' },
            { id: 'APPROVED', label: 'المقبولة' },
            { id: 'REJECTED', label: 'المرفوضة' },
            { id: '', label: 'الكل' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-colors text-center ${
                statusFilter === tab.id
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contributions Grid */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 animate-pulse">
            جاري تحميل السندات والمساهمات...
          </div>
        ) : data?.items && data.items.length > 0 ? (
          data.items.map((item: any) => {
            const isPending = item.status === ContributionStatus.PENDING;
            return (
              <div
                key={item.id}
                className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all duration-200 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
              >
                {/* Mosque & Project Info */}
                <div className="lg:col-span-4 space-y-2">
                  <div className="flex items-center gap-2 text-brand-400 text-xs font-bold">
                    <Building2 className="w-4 h-4" />
                    <span>{item.project?.mosqueName}</span>
                  </div>
                  <h3 className="font-bold text-white text-base leading-snug">
                    {item.project?.title}
                  </h3>
                  <p className="text-xs text-slate-400">
                    الموقع: {item.project?.governorate}
                  </p>
                </div>

                {/* Contribution details */}
                <div className="lg:col-span-3 space-y-1.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>المبلغ المدفوع:</span>
                    <span className="font-bold text-white text-sm">{item.amount} {item.currency}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>عدد الأسهم:</span>
                    <span className="font-bold text-brand-400">{item.shares} سهم</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>المودع:</span>
                    <span className="font-semibold text-slate-200">{item.donorName || 'فاعل خير'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>رقم الهاتف:</span>
                    <span className="font-semibold text-slate-200">
                      {item.donorPhone ? (
                        <span className="text-brand-400 font-mono flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>{item.donorPhone}</span>
                        </span>
                      ) : (
                        'فاعل خير'
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>البنك المستخدم:</span>
                    <span className="text-slate-300">{item.paymentMethod || 'تحويل مباشر'}</span>
                  </div>
                </div>

                {/* Receipt Preview */}
                <div className="lg:col-span-2 flex flex-col items-center justify-center">
                  {item.receiptUrl ? (
                    <button
                      onClick={() => setSelectedReceipt(item.receiptUrl)}
                      className="group relative w-20 h-20 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center hover:border-brand-500 transition-colors"
                    >
                      {item.receiptUrl.endsWith('.pdf') ? (
                        <span className="text-xs font-bold text-rose-400">PDF سند</span>
                      ) : (
                        <img src={item.receiptUrl} alt="سند" className="w-full h-full object-cover" />
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                        <Eye className="w-5 h-5" />
                      </div>
                    </button>
                  ) : (
                    <div className="text-xs text-slate-500 font-medium">بدون سند مرفق</div>
                  )}
                </div>

                {/* Actions */}
                <div className="lg:col-span-3 flex items-center justify-end gap-3">
                  {isPending ? (
                    <>
                      <button
                        onClick={() => approveMutation.mutate(item.id)}
                        disabled={approveMutation.isPending}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>قبول المساهمة</span>
                      </button>
                      <button
                        onClick={() => setRejectModalId(item.id)}
                        className="px-3.5 py-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>رفض</span>
                      </button>
                    </>
                  ) : (
                    <span
                      className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                        item.status === 'APPROVED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {item.status === 'APPROVED' ? '✓ تم القبول واحتساب الأسهم' : '✗ تم رفض المساهمة'}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-16 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-500">
            لا توجد مساهمات في هذه الفئة حالياً
          </div>
        )}
      </div>

      {/* Receipt Modal Viewer */}
      {selectedReceipt && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedReceipt(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h3 className="font-bold text-white text-base">معاينة سند التحويل البنكي</h3>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const response = await fetch(selectedReceipt);
                      const blob = await response.blob();
                      const blobUrl = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = blobUrl;
                      const ext = selectedReceipt.includes('.pdf') ? 'pdf' : 'jpg';
                      link.download = `masajid-receipt-${Date.now()}.${ext}`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      window.URL.revokeObjectURL(blobUrl);
                    } catch {
                      // Fallback direct download
                      const link = document.createElement('a');
                      link.href = selectedReceipt;
                      link.target = '_blank';
                      link.download = 'masajid-receipt';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-brand-600/20"
                  title="تحميل السند إلى جهازك"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تحميل السند</span>
                </button>
                <a
                  href={selectedReceipt}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <span>فتح بحجم كامل</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedReceipt(null)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                  title="إغلاق"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="overflow-auto max-h-[70vh] rounded-xl w-full flex items-center justify-center bg-slate-950/60 p-2">
              {selectedReceipt.endsWith('.pdf') ? (
                <iframe src={selectedReceipt} className="w-full h-96 rounded-xl" title="سند PDF"></iframe>
              ) : (
                <img src={selectedReceipt} alt="السند البنكي" className="max-h-[65vh] object-contain rounded-xl" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectModalId && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setRejectModalId(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-white text-base mb-2">رفض مساهمة المسجد</h3>
            <p className="text-xs text-slate-400 mb-4">
              يرجى توضيح سبب الرفض ليتم تسجيله في سجل المراقبة
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-rose-500"
            ></textarea>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setRejectModalId(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                إلغاء
              </button>
              <button
                onClick={() =>
                  rejectMutation.mutate({
                    id: rejectModalId,
                    reason: rejectReason,
                  })
                }
                disabled={rejectMutation.isPending}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
              >
                تأكيد الرفض
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
