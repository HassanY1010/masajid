import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiClient } from '../lib/api';
import { Landmark, Plus, Edit2, Trash2, CheckCircle2, XCircle } from 'lucide-react';

export const BankAccountsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    accountName: '',
    accountNumber: '',
    iban: '',
    currency: 'SAR',
    isActive: true,
  });

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['admin-bank-accounts'],
    queryFn: () => apiClient.get<any[]>('/admin/bank-accounts'),
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post('/admin/bank-accounts', payload),
    onSuccess: () => {
      setModalOpen(false);
      setFormData({
        name: '',
        displayName: '',
        accountName: '',
        accountNumber: '',
        iban: '',
        currency: 'SAR',
        isActive: true,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-bank-accounts'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/bank-accounts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bank-accounts'] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/admin/bank-accounts/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bank-accounts'] });
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">إدارة الحسابات البنكية</h1>
          <p className="text-sm text-slate-400 mt-1">
            الحسابات ومكاتب الصرافة المعتمدة لاستقبال تحويلات ومساهمات مشاريع بيوت الله
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold shadow-lg shadow-brand-600/30 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة حساب بنكي</span>
        </button>
      </div>

      {/* Accounts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full p-12 text-center text-slate-400 animate-pulse">
            جاري تحميل الحسابات البنكية...
          </div>
        ) : accounts && accounts.length > 0 ? (
          accounts.map((acc: any) => (
            <div
              key={acc.id}
              className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-400 font-bold">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">{acc.displayName}</h3>
                    <p className="text-xs text-slate-400 font-mono">{acc.name}</p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    toggleMutation.mutate({
                      id: acc.id,
                      isActive: !acc.isActive,
                    })
                  }
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                    acc.isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {acc.isActive ? 'مفعل' : 'معطل'}
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2">
                <div>
                  <span className="text-[11px] text-slate-500 block">اسم صاحب الحساب:</span>
                  <span className="text-xs font-bold text-slate-200">{acc.accountName}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">رقم الحساب:</span>
                  <span className="text-base font-black text-brand-400 font-mono tracking-wider">{acc.accountNumber}</span>
                </div>
                {acc.iban && (
                  <div>
                    <span className="text-[11px] text-slate-500 block">الآيبان IBAN:</span>
                    <span className="text-xs font-mono text-slate-300 break-all">{acc.iban}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end pt-2 border-t border-slate-800/60 gap-2">
                <button
                  onClick={() => deleteMutation.mutate(acc.id)}
                  disabled={deleteMutation.isPending}
                  className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                  title="حذف الحساب مباشرة"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full p-16 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-500">
            لا توجد حسابات بنكية مضافة
          </div>
        )}
      </div>

      {/* Add Bank Account Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-white text-lg mb-4">إضافة حساب بنكي أو صرافة</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate(formData);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">الرمز (معرف البنك بالإنجليزية)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AlAmqi, AlKuraimi, SNB"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">الاسم المعروض بالعربية</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شركة العمقي وإخوانه للصرافة"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">اسم صاحب الحساب</label>
                <input
                  type="text"
                  required
                  placeholder="مشروع مساجد لخدمة بيوت الله"
                  value={formData.accountName}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">رقم الحساب</label>
                <input
                  type="text"
                  required
                  placeholder="254019283"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:border-brand-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">الآيبان الدولي IBAN (اختياري)</label>
                <input
                  type="text"
                  placeholder="YE00AMQI..."
                  value={formData.iban}
                  onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:border-brand-500 focus:outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-6 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-600/30"
                >
                  حفظ الحساب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
