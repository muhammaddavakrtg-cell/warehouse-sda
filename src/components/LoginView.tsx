import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';

interface LoginViewProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function LoginView({ theme, onToggleTheme }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        setErrorMsg(
          error.message === 'Invalid login credentials'
            ? 'Email atau password salah.'
            : error.message
        );
      }
    } catch {
      setErrorMsg('Gagal menghubungi server autentikasi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight">GudangPro</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Masuk dengan akun staf gudang
            </p>
          </div>
          <button
            type="button"
            onClick={onToggleTheme}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            {theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
          </button>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-xl text-xs font-semibold bg-red-100 text-red-700 border border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800"
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label
              htmlFor="login-email"
              className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300"
            >
              Email
            </label>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama.staf@perusahaan.com"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300"
            >
              Password
            </label>
            <input
              id="login-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white transition cursor-pointer"
          >
            {isSubmitting ? 'Memproses masuk...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
}