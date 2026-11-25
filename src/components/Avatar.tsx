import { useState } from 'react';
import type { UserProfile } from '../types/warehouse';

interface AvatarProps {
  profile: UserProfile | null;
  className?: string; // ukuran, contoh: "w-9 h-9"
}

export function Avatar({ profile, className = 'w-9 h-9' }: AvatarProps) {
  const [gagal, setGagal] = useState(false);

  const nama = profile?.fullName || profile?.username || 'U';
  const inisial = nama.charAt(0).toUpperCase();

  if (profile?.avatarUrl && !gagal) {
    return (
      <img
        src={profile.avatarUrl}
        alt={nama}
        onError={() => setGagal(true)}
        className={`${className} rounded-xl object-cover border border-slate-200 dark:border-slate-700`}
      />
    );
  }

  return (
    <div
      className={`${className} rounded-xl bg-blue-600 text-white flex items-center justify-center text-sm font-bold`}
    >
      {inisial}
    </div>
  );
}