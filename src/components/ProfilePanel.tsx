import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { getAccessRoleLabel, type UserProfile } from '../types/warehouse';

interface ProfilePanelProps {
  profile: UserProfile | null;
  onProfileUpdated: (updated: UserProfile) => void;
  onNotify: (variant: 'success' | 'error' | 'info', title: string, desc?: string) => void;
}

export function ProfilePanel({ profile, onProfileUpdated, onNotify }: ProfilePanelProps) {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.fullName || '');
    setUsername(profile.username || '');
    setAvatarUrl(profile.avatarUrl || '');
  }, [profile]);

  if (!profile) return null;

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !supabase) return;

    if (!file.type.startsWith('image/')) {
      onNotify('error', 'Format tidak didukung', 'Pilih file gambar (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      onNotify('error', 'Ukuran terlalu besar', 'Ukuran foto profil maksimal 2 MB.');
      return;
    }

    setUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const filePath = `${profile.id}/avatar-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw new Error(uploadError.message || 'Gagal mengunggah foto profil.');
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) {
        throw new Error(updateError.message || 'Gagal menyimpan foto ke profil.');
      }

      setAvatarUrl(publicUrl);
      onProfileUpdated({ ...profile, avatarUrl: publicUrl });
      onNotify('success', 'Foto profil diperbarui', 'Foto profil baru Anda sudah tersimpan.');
    } catch (err: any) {
      onNotify('error', 'Gagal ganti foto', err?.message || 'Terjadi kesalahan.');
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    const cleanFullName = fullName.trim();
    const cleanUsername = username.trim().toLowerCase();

    if (!cleanUsername) {
      onNotify('error', 'Username wajib diisi', 'Username tidak boleh kosong.');
      return;
    }

    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: cleanFullName || cleanUsername,
          username: cleanUsername,
        })
        .eq('id', profile.id);

      if (error) {
        throw new Error(error.message || 'Gagal memperbarui data profil.');
      }

      const updated: UserProfile = {
        ...profile,
        fullName: cleanFullName || cleanUsername,
        username: cleanUsername,
        avatarUrl,
      };
      onProfileUpdated(updated);
      onNotify('success', 'Profil diperbarui', 'Nama dan username berhasil disimpan.');
    } catch (err: any) {
      onNotify('error', 'Gagal simpan profil', err?.message || 'Terjadi kesalahan.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    if (newPassword.length < 6) {
      onNotify('error', 'Password terlalu pendek', 'Password baru minimal 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      onNotify('error', 'Password tidak cocok', 'Konfirmasi password baru harus sama.');
      return;
    }

    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        throw new Error(error.message || 'Gagal mengganti password.');
      }

      setNewPassword('');
      setConfirmPassword('');
      onNotify('success', 'Password diganti', 'Password akun Anda telah berhasil diperbarui.');
    } catch (err: any) {
      onNotify('error', 'Gagal ganti password', err?.message || 'Terjadi kesalahan.');
    } finally {
      setSavingPassword(false);
    }
  };

  const initialLetter = (profile.fullName || profile.username || 'U').charAt(0).toUpperCase();

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={profile.fullName || profile.username}
              className="w-16 h-16 rounded-2xl object-cover border border-slate-200 dark:border-slate-700"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xl font-bold">
              {initialLetter}
            </div>
          )}

          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {profile.fullName || profile.username}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              @{profile.username} • {profile.email}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                Level: {getAccessRoleLabel(profile.role)}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  profile.canEdit
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {profile.canEdit ? 'Dapat Lihat & Edit' : 'Hanya Lihat'}
              </span>
            </div>
          </div>
        </div>

        <label className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
          {uploadingAvatar ? 'Mengunggah foto...' : 'Ganti Foto Profil'}
          <input
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            disabled={uploadingAvatar}
            className="hidden"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Edit Data Profil */}
        <form onSubmit={handleSaveProfile} className="space-y-3.5">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Data Profil</h3>
          <div>
            <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
              Nama Lengkap
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nama lengkap pengguna"
              className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
              Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <button
            type="submit"
            disabled={savingProfile}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white cursor-pointer"
          >
            {savingProfile ? 'Menyimpan...' : 'Simpan Data Profil'}
          </button>
        </form>

        {/* Form Ganti Password */}
        <form onSubmit={handleChangePassword} className="space-y-3.5">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Ganti Password</h3>
          <div>
            <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
              Password Baru
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
              Konfirmasi Password Baru
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi password baru"
              className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <button
            type="submit"
            disabled={savingPassword}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-60 text-white cursor-pointer"
          >
            {savingPassword ? 'Mengganti...' : 'Ganti Password'}
          </button>
        </form>
      </div>
    </section>
  );
}