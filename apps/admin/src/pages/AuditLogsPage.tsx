import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { FileClock, User, ShieldAlert } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: () => apiClient.get<any>('/admin/audit-logs'),
  });

  const getActionLabel = (action: string) => {
    const map: Record<string, { label: string; color: string }> = {
      ADMIN_LOGIN: { label: 'تسجيل دخول مشرف', color: 'text-blue-400 bg-blue-500/10' },
      ADMIN_CREATED_PROJECT: { label: 'إنشاء مشروع مسجد', color: 'text-emerald-400 bg-emerald-500/10' },
      ADMIN_UPDATED_PROJECT: { label: 'تعديل مشروع', color: 'text-amber-400 bg-amber-500/10' },
      ADMIN_PUBLISHED_PROJECT: { label: 'نشر مشروع للعامة', color: 'text-teal-400 bg-teal-500/10' },
      ADMIN_UNPUBLISHED_PROJECT: { label: 'إلغاء نشر مشروع', color: 'text-rose-400 bg-rose-500/10' },
      ADMIN_APPROVED_CONTRIBUTION: { label: 'قبول مساهمة وسند', color: 'text-emerald-400 bg-emerald-500/10' },
      ADMIN_REJECTED_CONTRIBUTION: { label: 'رفض مساهمة', color: 'text-rose-400 bg-rose-500/10' },
      ADMIN_CREATED_BANK_ACCOUNT: { label: 'إضافة حساب بنكي', color: 'text-indigo-400 bg-indigo-500/10' },
    };
    return map[action] || { label: action, color: 'text-slate-400 bg-slate-800' };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">سجل العمليات والرقابة الإدارية</h1>
        <p className="text-sm text-slate-400 mt-1">
          تسجيل غير قابل للتعديل لجميع العمليات الحساسة التي يجريها المشرفون في النظام
        </p>
      </div>

      {/* Mobile Card View */}
      <div className="block md:hidden space-y-4">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400 bg-slate-900 rounded-2xl animate-pulse">
            جاري تحميل سجل العمليات...
          </div>
        ) : data?.items && data.items.length > 0 ? (
          data.items.map((log: any) => {
            const act = getActionLabel(log.action);
            return (
              <div key={log.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${act.color}`}>
                    {act.label}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {new Date(log.createdAt).toLocaleTimeString('ar-SA')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <User className="w-4 h-4 text-slate-500" />
                  <span>المشرف: <strong>{log.admin?.name || 'مدير النظام'}</strong></span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-mono text-slate-400 space-y-1">
                  <p>العنصر: {log.entity} {log.entityId ? `#${log.entityId.slice(0, 8)}` : ''}</p>
                  <p className="truncate text-slate-500">{JSON.stringify(log.metadata)}</p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-slate-500 bg-slate-900 rounded-2xl">
            لا توجد عمليات مسجلة
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-xs font-semibold text-slate-400">
                <th className="p-4">نوع العملية</th>
                <th className="p-4">المشرف المسؤول</th>
                <th className="p-4">العنصر المتأثر</th>
                <th className="p-4">بيانات تفصيلية</th>
                <th className="p-4">التاريخ والوقت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400">
                    جاري تحميل سجل العمليات...
                  </td>
                </tr>
              ) : data?.items && data.items.length > 0 ? (
                data.items.map((log: any) => {
                  const act = getActionLabel(log.action);
                  return (
                    <tr key={log.id} className="hover:bg-slate-800/40">
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${act.color}`}>
                          {act.label}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-500" />
                          <span className="font-semibold text-slate-200">{log.admin?.name || 'مدير النظام'}</span>
                        </div>
                      </td>
                      <td className="p-4 text-xs font-mono text-slate-400">
                        {log.entity} {log.entityId ? `#${log.entityId.slice(0, 8)}` : ''}
                      </td>
                      <td className="p-4 text-xs text-slate-400 max-w-xs truncate font-mono">
                        {JSON.stringify(log.metadata)}
                      </td>
                      <td className="p-4 text-xs text-slate-400">
                        {new Date(log.createdAt).toLocaleString('ar-SA')}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500">
                    لا توجد عمليات مسجلة في سجل الرقابة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
