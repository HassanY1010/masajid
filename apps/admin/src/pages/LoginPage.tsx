import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Lock, Mail, Loader2, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@masajid.app');
  const [password, setPassword] = useState('AdminPassword123!');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res: any = await api.post('/auth/login', { email, password });
      login(res.accessToken, res.admin);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول. يرجى التأكد من البيانات.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 text-3xl shadow-xl shadow-brand-500/20 mb-4">
            🕌
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">منصة مساجد</h1>
          <p className="text-sm text-slate-400 mt-1">لوحة تحكم المشرفين والإدارة</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-400 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              البريد الإلكتروني
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 pl-10 transition-colors"
                placeholder="admin@masajid.app"
              />
              <Mail className="w-5 h-5 text-slate-500 absolute left-3 top-3.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              كلمة المرور
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 pl-10 transition-colors"
                placeholder="••••••••"
              />
              <Lock className="w-5 h-5 text-slate-500 absolute left-3 top-3.5 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>جاري التحقق...</span>
              </>
            ) : (
              <span>تسجيل الدخول</span>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-500">
            نظام مخصص لإدارة احتياجات المساجد والمساهمات المالية
          </p>
        </div>
      </div>
    </div>
  );
};
