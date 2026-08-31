import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';

// Lazy load non-landing heavy admin modules for instant initial load
const ProjectsListPage = lazy(() => import('./pages/ProjectsListPage').then((m) => ({ default: m.ProjectsListPage })));
const ProjectFormPage = lazy(() => import('./pages/ProjectFormPage').then((m) => ({ default: m.ProjectFormPage })));
const ContributionsReviewPage = lazy(() => import('./pages/ContributionsReviewPage').then((m) => ({ default: m.ContributionsReviewPage })));
const BankAccountsPage = lazy(() => import('./pages/BankAccountsPage').then((m) => ({ default: m.BankAccountsPage })));
const AuditLogsPage = lazy(() => import('./pages/AuditLogsPage').then((m) => ({ default: m.AuditLogsPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 2 * 60 * 1000, // 2 minutes cache validity before refetching
      gcTime: 10 * 60 * 1000, // Keep in memory for 10 minutes
      retry: 1,
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-brand-400 font-bold">
        جاري تهيئة النظام...
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const PageLoader = () => (
  <div className="p-12 text-center text-slate-400 font-semibold animate-pulse flex items-center justify-center gap-3">
    <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    <span>جاري تحميل الصفحة...</span>
  </div>
);

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="projects" element={<ProjectsListPage />} />
                <Route path="projects/new" element={<ProjectFormPage />} />
                <Route path="projects/:id/edit" element={<ProjectFormPage />} />
                <Route path="contributions" element={<ContributionsReviewPage />} />
                <Route path="bank-accounts" element={<BankAccountsPage />} />
                <Route path="audit-logs" element={<AuditLogsPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};
