import { useState, type FormEvent } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

interface LoginViewProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

const FALLBACK_DOMAIN = 'gudang.local';

const INPUT_CLASS =
  'w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500';
const LABEL_CLASS = 'block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300';
const PRIMARY_BTN_CLASS =
  'w-full py-2.5 px-4 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white transition cursor-pointer';

export function LoginView({ theme, onToggleTheme }: LoginViewProps) {
  const [mode, setMode] = useState<'login' | 'forgot' | 'register'>('login');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [resetEmail, setResetEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);

  // State form daftar
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const goToMode = (next: 'login' | 'forgot' | 'register') => {
    setErrorMsg('');
    setInfoMsg('');
    setMode(next);
  };

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

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (!supabase || !isSupabaseConfigured) {
      setErrorMsg(
        'Konfigurasi Supabase belum terbaca. Pastikan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY sudah diatur sebagai Config lalu di-redeploy.'
      );
      return;
    }

    const cleanName = regFullName.trim();
    const cleanUsername = regUsername.trim().toLowerCase();
    const cleanEmail = regEmail.trim().toLowerCase();

    if (!/^[a-z0-9._-]{3,30}$/.test(cleanUsername)) {
      setErrorMsg(
        'Username 3-30 karakter, hanya huruf kecil, angka, titik, garis bawah, atau strip (tanpa spasi dan tanpa @).'
      );
      return;
    }

    if (regPassword.length < 6) {
      setErrorMsg('Password minimal 6 karakter.');
      return;
    }

    if (regPassword !== regConfirm) {
      setErrorMsg('Konfirmasi password tidak sama dengan password.');
      return;
    }

    setIsRegistering(true);
    try {
      // Cek username belum dipakai
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', cleanUsername)
        .maybeSingle();

      if (existing) {
        setErrorMsg('Username sudah dipakai. Silakan pilih username lain.');
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: regPassword,
        options: {
          data: {
            username: cleanUsername,
            full_name: cleanName || cleanUsername,
          },
        },
      });

      if (error) {
        setErrorMsg(
          error.message.toLowerCase().includes('already registered')
            ? 'Email ini sudah terdaftar. Silakan masuk atau gunakan Lupa password.'
            : error.message
        );
        return;
      }

      setRegPassword('');
      setRegConfirm('');

      if (data.session) {
        // Konfirmasi email nonaktif: user otomatis masuk, App.tsx akan menampilkan dashboard.
        return;
      }

      // Konfirmasi email aktif: user harus klik tautan di emailnya dulu.
      setMode('login');
      setUsername(cleanUsername);
      setInfoMsg(
        `Pendaftaran berhasil. Kami mengirim tautan konfirmasi ke ${cleanEmail}. Buka email tersebut (cek juga folder Spam), lalu masuk di sini.`
      );
    } catch (err: any) {
      setErrorMsg(err?.message || 'Terjadi kesalahan saat mendaftar.');
    } finally {
      setIsRegistering(false);
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

  const subtitle =
    mode === 'login'
      ? 'Masuk menggunakan username dan password'
      : mode === 'register'
        ? 'Buat akun baru'
        : 'Reset password melalui email terdaftar';

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight">GudangPro</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
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

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="login-username" className={LABEL_CLASS}>
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
                className={INPUT_CLASS}
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
                  onClick={() => goToMode('forgot')}
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
                className={INPUT_CLASS}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !supabase || !isSupabaseConfigured}
              className={PRIMARY_BTN_CLASS}
            >
              {isSubmitting ? 'Memproses masuk...' : 'Masuk'}
            </button>

            <p className="text-center text-xs text-slate-600 dark:text-slate-400">
              Belum punya akun?{' '}
              <button
                type="button"
                onClick={() => goToMode('register')}
                className="font-semibold text-blue-600 hover:underline dark:text-blue-400 cursor-pointer"
              >
                Daftar
              </button>
            </p>
          </form>
        )}

        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label htmlFor="reg-fullname" className={LABEL_CLASS}>
                Nama Lengkap
              </label>
              <input
                id="reg-fullname"
                type="text"
                required
                autoComplete="name"
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
                placeholder="Nama lengkap Anda"
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label htmlFor="reg-username" className={LABEL_CLASS}>
                Username
              </label>
              <input
                id="reg-username"
                type="text"
                required
                autoComplete="username"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                placeholder="contoh: budi.santoso"
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label htmlFor="reg-email" className={LABEL_CLASS}>
                Email
              </label>
              <input
                id="reg-email"
                type="email"
                required
                autoComplete="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="nama@email.com"
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label htmlFor="reg-password" className={LABEL_CLASS}>
                Password
              </label>
              <input
                id="reg-password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label htmlFor="reg-confirm" className={LABEL_CLASS}>
                Konfirmasi Password
              </label>
              <input
                id="reg-confirm"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={regConfirm}
                onChange={(e) => setRegConfirm(e.target.value)}
                placeholder="Ulangi password"
                className={INPUT_CLASS}
              />
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Akun baru berlevel Member (hanya lihat). Admin dapat menaikkan level akun Anda.
            </p>

            <button
              type="submit"
              disabled={isRegistering || !supabase || !isSupabaseConfigured}
              className={PRIMARY_BTN_CLASS}
            >
              {isRegistering ? 'Mendaftarkan...' : 'Daftar'}
            </button>

            <button
              type="button"
              onClick={() => goToMode('login')}
              className="w-full py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
            >
              ← Sudah punya akun? Masuk
            </button>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label htmlFor="reset-email" className={LABEL_CLASS}>
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
                className={INPUT_CLASS}
              />
            </div>

            <button
              type="submit"
              disabled={isSendingReset || !supabase || !isSupabaseConfigured}
              className={PRIMARY_BTN_CLASS}
            >
              {isSendingReset ? 'Mengirim tautan...' : 'Kirim Tautan Reset Password'}
            </button>

            <button
              type="button"
              onClick={() => goToMode('login')}
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