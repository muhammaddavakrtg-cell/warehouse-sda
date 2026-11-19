import React, { useState } from 'react';
import { ArrowRight, Eye, EyeOff, Lock, Mail, Package, User } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';
import { loginStaff, registerStaff } from '../lib/warehouseApi';
import type { StaffUser } from '../types/warehouse';
import { PWAInstallButton } from './PWAInstallButton';

interface LoginViewProps {
  onAuthenticated: (user: StaffUser) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user =
        mode === 'login'
          ? await loginStaff(email, password)
          : await registerStaff(email, password, fullName);
      onAuthenticated(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Autentikasi gagal. Periksa kembali kredensial Anda.');
    } finally {
      setLoading(false);
    }
  };

  const fillDefaultStaff = () => {
    setMode('login');
    setEmail('staf@gudangku.id');
    setPassword('Gudang2026!');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 grid grid-cols-1 lg:grid-cols-12">
      {/* Left Architectural Warehouse Panel */}
      <div className="relative hidden lg:flex lg:col-span-6 xl:col-span-7 bg-slate-900 overflow-hidden items-stretch">
        {!heroImgFailed ? (
          <img
            src="/src/assets/images/warehouse_login_hero_1795057393706.jpg"
            alt="Interior gudang material industri dengan rak penyimpanan terorganisir"
            referrerPolicy="no-referrer"
            onError={() => setHeroImgFailed(true)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 flex items-center justify-center">
            <Package className="w-24 h-24 text-slate-700" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-slate-950/25" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white text-slate-900 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">GudangKu WMS</span>
          </div>

          <div className="max-w-xl">
            <p className="text-sm font-medium text-amber-400">
              Sistem Kontrol Material & Logistik
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight leading-tight text-balance">
              Kontrol presisi untuk setiap barang masuk dan keluar gudang.
            </h1>
            <p className="mt-4 text-base text-slate-300 leading-relaxed">
              Pantau ketersediaan stok secara real-time, deteksi material di bawah batas minimum, dan catat transaksi inbound maupun outbound langsung dari perangkat staf.
            </p>

            <div className="mt-8 pt-6 border-t border-white/15 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-300">
              <span>Autentikasi Supabase Auth</span>
              <span aria-hidden="true">·</span>
              <span>Sinkronisasi Stok Real-Time</span>
              <span aria-hidden="true">·</span>
              <span>PWA Siap Pasang di Ponsel</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Staff Login Panel */}
      <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-between px-6 py-8 sm:px-12 lg:px-14 bg-white">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-base font-bold tracking-tight text-slate-900">GudangKu WMS</span>
          </div>
          <div className="hidden lg:block text-xs font-medium text-slate-500">
            {isSupabaseConfigured ? 'Terhubung ke Supabase Auth' : 'Server Lokal Terintegrasi'}
          </div>
          <PWAInstallButton compact />
        </div>

        <div className="my-auto py-8 w-full max-w-md mx-auto">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              {mode === 'login' ? 'Masuk Staf Gudang' : 'Registrasi Staf Baru'}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {mode === 'login'
                ? 'Gunakan akun staf terdaftar untuk mengakses master material dan pencatatan stok.'
                : 'Daftarkan akun operasional staf gudang untuk memulai pencatatan transaksi.'}
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`min-h-[40px] rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Masuk Akun
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`min-h-[40px] rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                mode === 'register'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daftar Staf
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === 'register' && (
              <div>
                <label htmlFor="staff-name" className="block text-xs font-medium text-slate-700 mb-1.5">
                  Nama Lengkap Staf
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="staff-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full min-h-[44px] rounded-lg border border-slate-200 bg-white pl-10 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="staff-email" className="block text-xs font-medium text-slate-700 mb-1.5">
                Email Staf Gudang
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="staff-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staf@gudangku.id"
                  className="w-full min-h-[44px] rounded-lg border border-slate-200 bg-white pl-10 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="staff-password" className="block text-xs font-medium text-slate-700 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="staff-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full min-h-[44px] rounded-lg border border-slate-200 bg-white pl-10 pr-11 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[46px] rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>
                {loading
                  ? 'Memproses...'
                  : mode === 'login'
                  ? 'Masuk ke Workspace'
                  : 'Buat Akun Staf'}
              </span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {!isSupabaseConfigured && (
            <div className="mt-6 pt-5 border-t border-slate-200 flex items-center justify-between gap-4">
              <div className="text-xs text-slate-600">
                <p className="font-medium text-slate-900">Akses Staf Bawaan</p>
                <p className="mt-0.5 font-mono text-[11px] text-slate-500">
                  staf@gudangku.id · Gudang2026!
                </p>
              </div>
              <button
                type="button"
                onClick={fillDefaultStaff}
                className="min-h-[38px] rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Isi Kredensial
              </button>
            </div>
          )}
        </div>

        <p className="text-xs text-slate-500">
          GudangKu WMS · Manajemen Inventaris & Operasional Gudang
        </p>
      </div>
    </div>
  );
};
