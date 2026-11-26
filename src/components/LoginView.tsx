import { useState, type FormEvent, type ReactNode } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

type ThemeMode = 'system' | 'light' | 'dark';

interface LoginViewProps {
  themeMode: ThemeMode;
  onThemeModeChange: (mode: ThemeMode) => void;
  onLoginGuard?: (active: boolean) => void;
}

const ICON_PROPS = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

const SystemIcon = () => (
  <svg {...ICON_PROPS}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" />
  </svg>
);

const SunIcon = () => (
  <svg {...ICON_PROPS}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
);

const MoonIcon = () => (
  <svg {...ICON_PROPS}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </svg>
);

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: ReactNode }[] = [
  { value: 'system', label: 'Ikuti sistem', icon: <SystemIcon /> },
  { value: 'light', label: 'Mode terang', icon: <SunIcon /> },
  { value: 'dark', label: 'Mode gelap', icon: <MoonIcon /> },
];

const FALLBACK_DOMAIN = 'gudang.local';

type LoginGroup = 'staff' | 'employee';
interface PopupState {
  message: string;
  target: LoginGroup;
  buttonLabel: string;
}

const getPopupFor = (target: LoginGroup): PopupState =>
  target === 'employee'
    ? {
        message: 'Anda adalah karyawan, silakan login akun karyawan.',
        target: 'employee',
        buttonLabel: 'Login Akun Karyawan',
      }
    : {
        message: 'Anda adalah Admin/Staf, silakan login di bagian Admin & Staf.',
        target: 'staff',
        buttonLabel: 'Login Admin & Staf',
      };

type Mode = 'login' | 'forgot' | 'register';

// Catat aktivitas (login, daftar) ke tabel activity_logs lewat fungsi log_activity
const recordActivity = async (event: string) => {
  try {
    await supabase?.rpc('log_activity', {
      p_event: event,
      p_user_agent: navigator.userAgent,
    });
  } catch {
    // abaikan jika pencatatan gagal
  }
};

// Domain email yang diizinkan untuk pendaftaran (Google dan Yahoo).
// Tambahkan domain lain di daftar ini kalau diperlukan.
const ALLOWED_EMAIL_DOMAINS = [
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.co.id',
  'ymail.com',
  'rocketmail.com',
];

const INPUT_CLASS =
  'w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700/70 bg-white/60 dark:bg-slate-900/40 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 focus:border-slate-300 dark:focus:border-slate-600';
const LABEL_CLASS = 'block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300';
const PRIMARY_BTN_CLASS =
  'w-full py-2.5 px-4 rounded-xl text-sm font-bold bg-slate-600 hover:bg-slate-700 dark:bg-slate-600 dark:hover:bg-slate-500 disabled:opacity-60 text-white transition cursor-pointer';

export function LoginView({ themeMode, onThemeModeChange, onLoginGuard }: LoginViewProps) {
  const [mode, setMode] = useState<Mode>('login');

  // Bagian login: 'staff' = Admin & Staf, 'employee' = Karyawan
  const [group, setGroup] = useState<'staff' | 'employee'>('staff');

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
  // Popup salah tempat login (akun karyawan di tab Admin/Staf, atau sebaliknya)
  const [popup, setPopup] = useState<PopupState | null>(null);
  const [infoMsg, setInfoMsg] = useState(() => {
    try {
      if (window.sessionStorage.getItem('gudang-idle-logout')) {
        window.sessionStorage.removeItem('gudang-idle-logout');
        return 'Anda keluar otomatis karena lama tidak aktif. Silakan masuk kembali.';
      }
    } catch {
      // abaikan jika penyimpanan tidak tersedia
    }
    return '';
  });

  const goToMode = (next: Mode) => {
    setErrorMsg('');
    setInfoMsg('');
    setMode(next);
  };

  const switchGroup = (next: 'staff' | 'employee') => {
    setGroup(next);
    setErrorMsg('');
    setInfoMsg('');
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
      const { data, error } = await supabase.rpc('get_login_email', {
        p_username: clean,
      });

      if (!error && data) {
        return String(data).trim().toLowerCase();
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
    // Tahan halaman login selama level akun dicek, supaya dashboard tidak sempat tampil
    onLoginGuard?.(true);

    try {
      const resolvedEmail = await resolveEmailByUsername(username);
      const { data: signInData, error } = await supabase.auth.signInWithPassword({
        email: resolvedEmail,
        password,
      });
      if (error) {
        setErrorMsg(
          error.message === 'Invalid login credentials'
            ? 'Username atau password salah.'
            : error.message
        );
      } else {
        // Cek apakah level akun sesuai dengan tab yang dipilih
        const userId = signInData.user?.id;
        if (userId) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .maybeSingle();

          const role = String(prof?.role ?? '').toLowerCase();
          const isStaffGroup = role === 'admin' || role === 'staff';

          if (role && group === 'staff' && !isStaffGroup) {
            await supabase.auth.signOut();
            setPopup(getPopupFor('employee'));
          } else if (role && group === 'employee' && isStaffGroup) {
            await supabase.auth.signOut();
            setPopup(getPopupFor('staff'));
          } else {
            await recordActivity('LOGIN');
          }
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal menghubungi server autentikasi.');
    } finally {
      setIsSubmitting(false);
      onLoginGuard?.(false);
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

    const emailDomain = cleanEmail.split('@')[1] || '';
    if (!ALLOWED_EMAIL_DOMAINS.includes(emailDomain)) {
      setErrorMsg(
        'Gunakan email aktif dari Google (Gmail) atau Yahoo. Email di luar itu tidak dapat didaftarkan.'
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
          emailRedirectTo: `${window.location.origin}/`,
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
        await recordActivity('REGISTER');
        return;
      }

      // Konfirmasi email aktif: user harus klik tautan aktivasi di emailnya dulu.
      setMode('login');
      setGroup('employee');
      setUsername(cleanUsername);
      setInfoMsg(
        `Pendaftaran berhasil. Kami mengirim tautan aktivasi ke ${cleanEmail}. Buka email tersebut (cek juga folder Spam), klik tautan aktivasinya, lalu masuk di sini.`
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
      ? group === 'staff'
        ? 'Masuk sebagai Admin atau Staf'
        : 'Masuk sebagai Karyawan'
      : mode === 'register'
        ? 'Buat akun baru'
        : 'Reset password melalui email terdaftar';

  const tabClass = (active: boolean) =>
    `py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
      active
        ? 'bg-white/80 text-slate-800 shadow-sm dark:bg-slate-700/60 dark:text-slate-100'
        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
    }`;

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/70 dark:border-slate-700/50 bg-slate-50/80 dark:bg-slate-800/50 p-6 sm:p-8">
        <div className="flex justify-end mb-4">
          <div
            role="group"
            aria-label="Pilihan tema"
            className="inline-flex p-0.5 rounded-xl bg-slate-200/60 dark:bg-slate-900/40"
          >
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onThemeModeChange(opt.value)}
                aria-pressed={themeMode === opt.value}
                aria-label={opt.label}
                title={opt.label}
                className={`flex items-center justify-center w-8 h-7 rounded-lg transition cursor-pointer ${
                  themeMode === opt.value
                    ? 'bg-white/80 text-slate-800 shadow-sm dark:bg-slate-700/60 dark:text-slate-100'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {opt.icon}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Inventory Warehouse</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
          </div>
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
          <div className="grid grid-cols-2 gap-1 p-1 mb-5 rounded-xl bg-slate-200/60 dark:bg-slate-900/40">
            <button
              type="button"
              onClick={() => switchGroup('staff')}
              className={tabClass(group === 'staff')}
            >
              Admin & Staf
            </button>
            <button
              type="button"
              onClick={() => switchGroup('employee')}
              className={tabClass(group === 'employee')}
            >
              Karyawan
            </button>
          </div>
        )}

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="login-username" className={LABEL_CLASS}>
                Username / E-mail
              </label>
              <input
                id="login-username"
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username atau e-mail Anda"
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
                  className="text-xs font-semibold text-slate-600 hover:underline dark:text-slate-300 cursor-pointer"
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
                className="font-semibold text-slate-600 hover:underline dark:text-slate-300 cursor-pointer"
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
                minLength={3}
                maxLength={30}
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
                autoComplete="off"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Masukkan password"
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
                autoComplete="off"
                value={regConfirm}
                onChange={(e) => setRegConfirm(e.target.value)}
                placeholder="Masukkan ulang password"
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

      {popup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/30 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800 p-6 text-center shadow-lg">
            <h2 className="text-lg font-bold mb-2">Perhatian</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-5">{popup.message}</p>
            <button
              type="button"
              onClick={() => {
                const target = popup.target;
                setPopup(null);
                setMode('login');
                switchGroup(target);
              }}
              className={PRIMARY_BTN_CLASS}
            >
              {popup.buttonLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}