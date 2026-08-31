import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  HandCoins,
  Landmark,
  FileClock,
  LogOut,
  PlusCircle,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';

export const Layout: React.FC = () => {
  const { admin, logout } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: 'الرئيسية والإحصائيات', icon: LayoutDashboard },
    { to: '/projects', label: 'إدارة المشاريع', icon: Building2 },
    { to: '/projects/new', label: 'إضافة مشروع جديد', icon: PlusCircle },
    { to: '/contributions', label: 'مراجعة المساهمات والسندات', icon: HandCoins },
    { to: '/bank-accounts', label: 'الحسابات البنكية', icon: Landmark },
    { to: '/audit-logs', label: 'سجل العمليات الإدارية', icon: FileClock },
  ];

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-72 bg-slate-900 border-l border-slate-800 p-6 flex-shrink-0 justify-between">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 pb-6 border-b border-slate-800">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center shadow-lg shadow-brand-500/20 text-white font-black text-2xl">
              🕌
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">مساجد</h1>
              <p className="text-xs text-slate-400 font-medium">لوحة تحكم خدمة بيوت الله</p>
            </div>
          </div>

          {/* Navigation Links with Smart Hover Prefetching */}
          <nav className="mt-6 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onMouseEnter={() => {
                    if (item.to === '/') {
                      queryClient.prefetchQuery({
                        queryKey: ['admin-stats'],
                        queryFn: () => apiClient.get<any>('/admin/dashboard'),
                      });
                    } else if (item.to === '/projects') {
                      queryClient.prefetchQuery({
                        queryKey: ['admin-projects', '', '', ''],
                        queryFn: () => apiClient.get<any>('/admin/projects'),
                      });
                    } else if (item.to === '/contributions') {
                      queryClient.prefetchQuery({
                        queryKey: ['admin-contributions', 'PENDING'],
                        queryFn: () => apiClient.get<any>('/admin/contributions', { params: { status: 'PENDING' } }),
                      });
                    } else if (item.to === '/bank-accounts') {
                      queryClient.prefetchQuery({
                        queryKey: ['admin-bank-accounts'],
                        queryFn: () => apiClient.get<any[]>('/admin/bank-accounts'),
                      });
                    }
                  }}
                  className={({ isActive }) =>
                    `flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Info & Logout */}
        <div className="pt-6 border-t border-slate-800">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800">
            <div className="truncate">
              <p className="text-sm font-bold text-slate-200 truncate">{admin?.name}</p>
              <p className="text-xs text-slate-400 truncate">{admin?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              title="تسجيل الخروج"
              className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <span className="text-sm font-semibold text-brand-400 hidden sm:inline-block">
              نظام إدارة احتياجات ومشاريع المساجد
            </span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://masajid-1ggr.onrender.com/docs/swagger"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-brand-400 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/50 transition-colors"
            >
              <span>Swagger API</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <div className="h-4 w-px bg-slate-800"></div>
            <div className="text-xs text-slate-400 font-mono bg-slate-800/50 px-2.5 py-1 rounded border border-slate-700">
              v1.0.0 Live
            </div>
          </div>
        </header>

        {/* Mobile Sidebar */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex">
            <div className="w-72 bg-slate-900 p-6 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🕌</span>
                    <span className="font-bold text-lg text-white">مساجد</span>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <nav className="mt-6 space-y-2">
                  {navItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                          isActive ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                        }`
                      }
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </nav>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium text-sm"
              >
                <LogOut className="w-5 h-5" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </div>
        )}

        {/* Body Content */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
