"use client";
import { useEffect, useRef } from "react";

const KEY = "lastActivity";
const IDLE_MS = 15 * 60 * 1000; // 15 menit, ubah sesuai kebutuhan

export function useIdleLogout(onLogout: () => void, enabled: boolean) {
  const cb = useRef(onLogout);
  cb.current = onLogout;

  useEffect(() => {
    // belum login / sudah keluar: bersihkan catatan lama
    if (!enabled) {
      localStorage.removeItem(KEY);
      return;
    }

    const mark = () => localStorage.setItem(KEY, Date.now().toString());

    const check = () => {
      const last = Number(localStorage.getItem(KEY) || Date.now());
      if (Date.now() - last > IDLE_MS) {
        localStorage.removeItem(KEY);
        cb.current();
        return true;
      }
      return false;
    };

    // cek saat web dibuka kembali
    if (check()) return;
    mark();

    let lastWrite = 0;
    const onActivity = () => {
      const now = Date.now();
      if (now - lastWrite > 5000) {
        lastWrite = now;
        mark();
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };

    const events = ["click", "keydown", "touchstart", "scroll", "mousemove"];
    events.forEach((e) =>
      window.addEventListener(e, onActivity, { passive: true })
    );
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", onVisible);
    window.addEventListener("focus", onVisible);
    const timer = setInterval(check, 30000);

    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity));
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onVisible);
      window.removeEventListener("focus", onVisible);
      clearInterval(timer);
    };
  }, [enabled]);
}