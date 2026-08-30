import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import {
  Building2,
  CheckCircle2,
  Clock,
  HandCoins,
  TrendingUp,
  Banknote,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => apiClient.get<any>('/admin/dashboard'),
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-800 rounded-lg w-48"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-800 rounded-2xl"></div>
          ))}
        </div>
        <div className="h-80 bg-slate-800 rounded-2xl"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
        تعذر تحميل بيانات لوحة التحكم. تأكد من تشغيل الخادم وقاعدة البيانات.
      </div>
    );
  }

  const kpis = [
    {
      title: 'إجمالي المشاريع',
      value: stats?.totalProjects || 0,
      sub: `${stats?.publishedProjects || 0} منشور للزوار`,
      icon: Building2,
      color: 'from-blue-600 to-indigo-600',
    },
    {
      title: 'مشاريع قيد التمويل',
      value: stats?.fundingProjects || 0,
      sub: 'تستقبل مساهمات الأسهم',
      icon: Clock,
      color: 'from-amber-500 to-orange-600',
    },
    {
      title: 'مشاريع مكتملة التمويل',
      value: stats?.completedProjects || 0,
      sub: 'تم استيفاء كامل التكاليف',
      icon: CheckCircle2,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      title: 'سندات بانتظار المراجعة',
      value: stats?.pendingContributions || 0,
      sub: 'تحتاج تدقيق وموافقة الإدارة',
      icon: HandCoins,
      color: 'from-rose-500 to-pink-600',
      highlight: (stats?.pendingContributions || 0) > 0,
    },
  ];

  const financialCards = [
    {
      title: 'إجمالي المبالغ المحصلة المعتمدة',
      value: `${(stats?.totalFundedAmount || 0).toLocaleString()} SAR`,
      icon: Banknote,
    },
    {
      title: 'إجمالي الأسهم المكتتبة',
      value: `${(stats?.totalFundedShares || 0).toLocaleString()} سهم`,
      icon: TrendingUp,
    },
  ];

  const pieData = [
    { name: 'قيد التمويل', value: stats?.fundingProjects || 0, color: '#f59e0b' },
    { name: 'مكتملة التمويل', value: stats?.completedProjects || 0, color: '#10b981' },
    { name: 'مسودة / أخرى', value: Math.max(0, (stats?.totalProjects || 0) - (stats?.fundingProjects || 0) - (stats?.completedProjects || 0)), color: '#64748b' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">نظرة عامة وإحصائيات</h1>
          <p className="text-sm text-slate-400 mt-1">متابعة شاملة لتمويل مشاريع المساجد وحالة السندات</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/projects/new"
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold shadow-lg shadow-brand-600/20 transition-colors"
          >
            + إضافة مشروع جديد
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <div
              key={index}
              className={`p-6 rounded-2xl bg-slate-900 border transition-all duration-200 relative overflow-hidden ${
                kpi.highlight
                  ? 'border-rose-500/50 shadow-lg shadow-rose-500/10'
                  : 'border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400">{kpi.title}</p>
                  <p className="text-3xl font-black text-white mt-2">{kpi.value}</p>
                  <p className="text-xs text-slate-500 mt-1">{kpi.sub}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${kpi.color} flex items-center justify-center text-white shadow-md`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Financial Aggregates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {financialCards.map((card, idx) => (
          <div key={idx} className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800/60 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">{card.title}</p>
              <p className="text-2xl font-black text-brand-400 mt-2">{card.value}</p>
            </div>
            <div className="p-3 bg-brand-500/10 text-brand-400 rounded-xl border border-brand-500/20">
              <card.icon className="w-7 h-7" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Distribution Pie */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-1">توزيع حالات المشاريع</h3>
            <p className="text-xs text-slate-400">نسبة الإنجاز والتمويل للمشاريع المسجلة</p>
          </div>
          <div className="h-56 my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-800 text-center">
            {pieData.map((d, i) => (
              <div key={i}>
                <div className="w-2.5 h-2.5 rounded-full mx-auto mb-1" style={{ backgroundColor: d.color }}></div>
                <p className="text-[11px] text-slate-400">{d.name}</p>
                <p className="text-sm font-bold text-white">{d.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Pending Contributions */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">آخر المساهمات الواردة</h3>
              <p className="text-xs text-slate-400">مساهمات وسندات قيد الانتظار أو المعالجة</p>
            </div>
            <Link to="/contributions" className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1">
              <span>عرض الكل</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-800 flex-1">
            {stats?.recentContributions && stats.recentContributions.length > 0 ? (
              stats.recentContributions.map((c: any) => (
                <div key={c.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-sm font-bold text-brand-400">
                      {c.shares}س
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{c.project?.mosqueName || 'مشروع مسجد'}</p>
                      <p className="text-xs text-slate-400">{c.donorName || 'فاعل خير'} • {c.amount} SAR</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    c.status === 'APPROVED'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : c.status === 'REJECTED'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {c.status === 'APPROVED' ? 'مقبول' : c.status === 'REJECTED' ? 'مرفوض' : 'قيد المراجعة'}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-500 text-sm">
                لا توجد مساهمات مسجلة حتى الآن
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
