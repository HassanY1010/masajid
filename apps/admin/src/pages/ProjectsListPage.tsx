import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiClient } from '../lib/api';
import { Link } from 'react-router-dom';
import {
  Building2,
  Search,
  Filter,
  PlusCircle,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import { ProjectCategory, ProjectStatus } from '@masajid/shared-types';

export const ProjectsListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-projects', search, statusFilter, categoryFilter],
    queryFn: () =>
      apiClient.get<any>('/admin/projects', {
        params: {
          search: search || undefined,
          status: statusFilter || undefined,
          category: categoryFilter || undefined,
        },
      }),
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      api.patch(`/admin/projects/${id}/publish`, { isPublished }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  const getStatusBadge = (status: ProjectStatus, isPublished: boolean) => {
    if (!isPublished) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
          مسودة (غير منشور)
        </span>
      );
    }
    switch (status) {
      case ProjectStatus.FUNDING:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            قيد التمويل
          </span>
        );
      case ProjectStatus.FULLY_FUNDED:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            مكتمل التمويل
          </span>
        );
      case ProjectStatus.IN_PROGRESS:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            قيد التنفيذ
          </span>
        );
      case ProjectStatus.COMPLETED:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20">
            تم الإنجاز
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-700 text-slate-300">
            {status}
          </span>
        );
    }
  };

  const getCategoryLabel = (category: string) => {
    const map: Record<string, string> = {
      CONSTRUCTION: 'بناء وتشييد',
      RENOVATION: 'ترميم وتأهيل',
      MAINTENANCE: 'صيانة عامة',
      SOLAR: 'طاقة شمسية',
      WATER: 'سقيا ومياه',
      ELECTRICITY: 'كهرباء وإنارة',
      CLEANING: 'نظافة وتعقيم',
      FURNISHING: 'فرش وتجهيز',
      QURAN_SUPPLIES: 'مصاحف ومستلزمات',
      OTHER: 'أخرى',
    };
    return map[category] || category;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">إدارة مشاريع المساجد</h1>
          <p className="text-sm text-slate-400 mt-1">إنشاء وتعديل ونشر مشاريع احتياجات المساجد</p>
        </div>
        <Link
          to="/projects/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold shadow-lg shadow-brand-600/30 transition-colors"
        >
          <PlusCircle className="w-5 h-5" />
          <span>إضافة مشروع جديد</span>
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="بحث باسم المسجد، المحافظة، العنوان..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 pr-10"
          />
          <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5 pointer-events-none" />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-brand-500"
          >
            <option value="">جميع الحالات</option>
            <option value="DRAFT">مسودة</option>
            <option value="FUNDING">قيد التمويل</option>
            <option value="FULLY_FUNDED">مكتمل التمويل</option>
            <option value="COMPLETED">مكتمل</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-brand-500"
          >
            <option value="">جميع الفئات</option>
            <option value="SOLAR">طاقة شمسية</option>
            <option value="WATER">سقيا ومياه</option>
            <option value="MAINTENANCE">صيانة</option>
            <option value="FURNISHING">فرش وتجهيز</option>
            <option value="CONSTRUCTION">بناء</option>
          </select>
        </div>
      </div>

      {/* Projects Display: Cards on Mobile, Table on Desktop */}
      <div className="block md:hidden space-y-4">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400 bg-slate-900 rounded-2xl animate-pulse">
            جاري تحميل المشاريع...
          </div>
        ) : data?.items && data.items.length > 0 ? (
          data.items.map((project: any) => {
            const cover = project.images?.find((img: any) => img.type === 'COVER') || project.images?.[0];
            return (
              <div key={project.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-700">
                    {cover ? (
                      <img src={cover.url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-xl">
                        🕌
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-base truncate">{project.title}</p>
                    <p className="text-xs text-brand-400 font-medium">{project.mosqueName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{project.governorate} - {project.district}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                  <div>
                    <span className="text-slate-500">الفئة: </span>
                    <span className="text-slate-300 font-semibold">{getCategoryLabel(project.category)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">الحالة: </span>
                    {getStatusBadge(project.status, project.isPublished)}
                  </div>
                  <div className="col-span-2 pt-2 border-t border-slate-800 flex justify-between">
                    <span>التكلفة: <strong className="text-white">{project.estimatedCost.toLocaleString()} {project.currency}</strong></span>
                    <span>الأسهم: <strong className="text-brand-400">{project.totalShares} سهم</strong></span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">نسبة التمويل ({project.fundingPercentage}%)</span>
                    <span className="text-brand-400 font-bold">{project.fundedShares} سهم مكتتب</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-brand-500 rounded-full"
                      style={{ width: `${project.fundingPercentage}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <button
                    onClick={() =>
                      publishMutation.mutate({
                        id: project.id,
                        isPublished: !project.isPublished,
                      })
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                      project.isPublished
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-brand-500/10 text-brand-400 border-brand-500/20'
                    }`}
                  >
                    {project.isPublished ? 'إلغاء النشر' : 'نشر المشروع'}
                  </button>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/projects/${project.id}/edit`}
                      className="p-2 rounded-lg text-slate-300 bg-slate-800 hover:text-white"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => {
                        if (confirm('هل أنت متأكد من حذف هذا المشروع؟')) {
                          deleteMutation.mutate(project.id);
                        }
                      }}
                      className="p-2 rounded-lg text-rose-400 bg-rose-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-slate-500 bg-slate-900 rounded-2xl">
            لا توجد مشاريع مسجلة
          </div>
        )}
      </div>

      {/* Projects Desktop Table */}
      <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-xs font-semibold text-slate-400">
                <th className="p-4">المشروع والمسجد</th>
                <th className="p-4">الموقع</th>
                <th className="p-4">الفئة</th>
                <th className="p-4">التكلفة والأسهم</th>
                <th className="p-4">نسبة التمويل</th>
                <th className="p-4">الحالة</th>
                <th className="p-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    جاري تحميل المشاريع...
                  </td>
                </tr>
              ) : data?.items && data.items.length > 0 ? (
                data.items.map((project: any) => {
                  const cover = project.images?.find((img: any) => img.type === 'COVER') || project.images?.[0];
                  return (
                    <tr key={project.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-700">
                            {cover ? (
                              <img src={cover.url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold">
                                🕌
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-white line-clamp-1">{project.title}</p>
                            <p className="text-xs text-brand-400 font-medium">{project.mosqueName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-300">
                        <p>{project.governorate}</p>
                        <p className="text-xs text-slate-500">{project.district}</p>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-md text-xs bg-slate-800 text-slate-300">
                          {getCategoryLabel(project.category)}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-white">{project.estimatedCost.toLocaleString()} {project.currency}</p>
                        <p className="text-xs text-slate-400">{project.totalShares} سهم ({project.shareValue} SAR/سهم)</p>
                      </td>
                      <td className="p-4">
                        <div className="w-32 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">{project.fundingPercentage}%</span>
                            <span className="text-brand-400 font-medium">{project.fundedShares} سهم</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-brand-500 rounded-full"
                              style={{ width: `${project.fundingPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(project.status, project.isPublished)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() =>
                              publishMutation.mutate({
                                id: project.id,
                                isPublished: !project.isPublished,
                              })
                            }
                            title={project.isPublished ? 'إلغاء النشر' : 'نشر المشروع للزوار'}
                            className={`p-2 rounded-lg text-xs font-semibold border transition-colors ${
                              project.isPublished
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                                : 'bg-brand-500/10 text-brand-400 border-brand-500/20 hover:bg-brand-500/20'
                            }`}
                          >
                            {project.isPublished ? 'إخفاء' : 'نشر'}
                          </button>
                          <Link
                            to={`/projects/${project.id}/edit`}
                            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="تعديل المشروع"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => {
                              if (confirm('هل أنت متأكد من حذف أو أرشفة هذا المشروع؟')) {
                                deleteMutation.mutate(project.id);
                              }
                            }}
                            className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">
                    لا توجد مشاريع مطابقة للبحث
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
