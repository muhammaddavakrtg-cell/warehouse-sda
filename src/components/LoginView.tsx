import { useState, type FormEvent } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

interface LoginViewProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

const FALLBACK_DOMAIN = 'gudang.local';

export function LoginView({ theme, onToggleTheme }: LoginViewProps) {
  const [mode, setMode] = useState<'login' | 'forgot'>('login');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [resetEmail, setResetEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const resolveEmailByUsername = async (rawUsername: string): Promise<string> => {
    const clean = rawUsername.trim().toLowerCase();
    if (!clean) {
      throw new Error('Username wajib diisi.');
    }

    if (clean.includes('@')) {
      return clean;
    }

    if (supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', clean)
        .maybeSingle();

      if (!error && data?.email) {
        return String(data.email).trim().toLowerCase();
      }
    }

    return `${clean}@${FALLBACK_DOMAIN}`;
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (!supabase || !isSupabaseConfigured) {
      setErrorMsg(
        'Konfigurasi Supabase belum terbaca. Pastikan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY sudah diatur sebagai Config lalu di-redeploy.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const resolvedEmail = await resolveEmailByUsername(username);
      const { error } = await supabase.auth.signInWithPassword({
        email: resolvedEmail,
        password,
      });
      if (error) {
        setErrorMsg(
          error.message === 'Invalid login credentials'
            ? 'Username atau password salah.'
            : error.message
        );
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal menghubungi server autentikasi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (!supabase || !isSupabaseConfigured) {
      setErrorMsg(
        'Konfigurasi Supabase belum terbaca. Pastikan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY sudah diatur sebagai Config lalu di-redeploy.'
      );
      return;
    }

    const emailClean = resetEmail.trim();
    if (!emailClean) {
      setErrorMsg('Masukkan alamat email terdaftar untuk menerima tautan reset password.');
      return;
    }

    setIsSendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(emailClean, {
        redirectTo: `${window.location.origin}/`,
      });

      if (error) {
        setErrorMsg(error.message || 'Gagal mengirim email reset password.');
      } else {
        setInfoMsg(
          `Tautan reset password telah dikirim ke ${emailClean}. Silakan periksa kotak masuk atau folder Spam.`
        );
      }
    } catch {
      setErrorMsg('Terjadi kesalahan saat mengirim permintaan reset password.');
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight">GudangPro</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {mode === 'login'
                ? 'Masuk menggunakan username dan password'
                : 'Reset password melalui email terdaftar'}
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

        {(!supabase || !isSupabaseConfigured) && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-xl text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800"
          >
            Variabel <strong>VITE_SUPABASE_URL</strong> dan <strong>VITE_SUPABASE_ANON_KEY</strong>{' '}
            belum terbaca pada build ini.
          </div>
        )}

        {errorMsg && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-xl text-xs font-semibold bg-red-100 text-red-700 border border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800"
          >
            {errorMsg}
          </div>
        )}

        {infoMsg && (
          <div
            role="status"
            className="mb-4 p-3 rounded-xl text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
          >
            {infoMsg}
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="login-username"
                className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300"
              >
                Username
              </label>
              <input
                id="login-username"
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username Anda"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setInfoMsg('');
                    setMode('forgot');
                  }}
                  className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400 cursor-pointer"
                >
                  Lupa password?
                </button>
              </div>
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
              disabled={isSubmitting || !supabase || !isSupabaseConfigured}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white transition cursor-pointer"
            >
              {isSubmitting ? 'Memproses masuk...' : 'Masuk'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label
                htmlFor="reset-email"
                className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300"
              >
                Email Terdaftar
              </label>
              <input
                id="reset-email"
                type="email"
                required
                autoComplete="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="nama.staf@perusahaan.com"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSendingReset || !supabase || !isSupabaseConfigured}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white transition cursor-pointer"
            >
              {isSendingReset ? 'Mengirim tautan...' : 'Kirim Tautan Reset Password'}
            </button>

            <button
              type="button"
              onClick={() => {
                setErrorMsg('');
                setInfoMsg('');
                setMode('login');
              }}
              className="w-full py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
            >
              ← Kembali ke halaman login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}