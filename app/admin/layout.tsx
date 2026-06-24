'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();

  const [isMounted, setIsMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [loginAttempts, setLoginAttempts] = useState(() => {
    try {
      const stored = sessionStorage.getItem('admin-login-attempts');
      return stored ? parseInt(stored, 10) : 0;
    } catch { return 0; }
  });
  const [loginCooldown, setLoginCooldown] = useState(() => {
    try {
      const storedCooldownUntil = sessionStorage.getItem('admin-login-cooldown-until');
      if (storedCooldownUntil) {
        const remaining = Math.ceil((parseInt(storedCooldownUntil, 10) - Date.now()) / 1000);
        if (remaining > 0) return remaining;
        sessionStorage.removeItem('admin-login-cooldown-until');
      }
    } catch { /* sessionStorage unavailable */ }
    return 0;
  });

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const res = await fetch('/api/admin/verify');
        if (active) {
          if (res.ok) {
            setIsAuthenticated(true);
          } else {
            await supabase.auth.signOut();
            setIsAuthenticated(false);
          }
          setIsMounted(true);
        }
      } catch {
        if (active) {
          setIsAuthenticated(false);
          setIsMounted(true);
        }
      }
    }

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (active) {
        if (session) {
          const res = await fetch('/api/admin/verify');
          if (active) {
            if (res.ok) {
              setIsAuthenticated(true);
            } else {
              await supabase.auth.signOut();
              setIsAuthenticated(false);
            }
          }
        } else {
          setIsAuthenticated(false);
        }
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (loginCooldown <= 0) return;
    const timer = setInterval(() => {
      setLoginCooldown((prev) => {
        if (prev <= 5) {
          clearInterval(timer);
          setLoginAttempts(0);
          try {
            sessionStorage.removeItem('admin-login-attempts');
            sessionStorage.removeItem('admin-login-cooldown-until');
          } catch { /* noop */ }
          return 0;
        }
        return prev - 5;
      });
    }, 5000);
    return () => clearInterval(timer);
  }, [loginCooldown]);

  const lastActivityRef = useRef(0);
  const SESSION_TIMEOUT_MS = 55 * 60 * 1000;

  const resetActivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll', 'mousemove'] as const;
    for (const evt of events) {
      window.addEventListener(evt, resetActivityTimer, { passive: true });
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed >= SESSION_TIMEOUT_MS) {
        supabase.auth.signOut();
        window.location.href = '/admin';
      }
    }, 30_000);

    return () => {
      for (const evt of events) {
        window.removeEventListener(evt, resetActivityTimer);
      }
      clearInterval(interval);
    };
  }, [isAuthenticated, resetActivityTimer, SESSION_TIMEOUT_MS]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginCooldown > 0) return;

    setError('');
    setIsLoading(true);

    try {
      const loginRes = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await loginRes.json();

      if (!loginRes.ok) {
        if (loginRes.status === 429) {
          setLoginCooldown(data.cooldown);
          setLoginAttempts(5);
          try {
            sessionStorage.setItem('admin-login-attempts', '5');
            sessionStorage.setItem('admin-login-cooldown-until', String(Date.now() + data.cooldown * 1000));
          } catch { /* noop */ }
          setError(`محاولات كثيرة جداً. يرجى الانتظار ${data.cooldown} ثانية قبل المحاولة مرة أخرى.`);
        } else {
          const newCount = data.attempts ?? (loginAttempts + 1);
          setLoginAttempts(newCount);
          try { sessionStorage.setItem('admin-login-attempts', String(newCount)); } catch { /* noop */ }
          if (newCount >= 5) {
            const until = Date.now() + 60000;
            setLoginCooldown(60);
            try { sessionStorage.setItem('admin-login-cooldown-until', String(until)); } catch { /* noop */ }
            setError(`محاولات كثيرة جداً. يرجى الانتظار 60 ثانية قبل المحاولة مرة أخرى.`);
          } else {
            setError(data.error || `فشل تسجيل الدخول. تحقق من البريد الإلكتروني وكلمة المرور.`);
          }
        }
      } else {
        setPassword('');
        // Re-verify session using the cookies set by the login API route
        try {
          const verifyRes = await fetch('/api/admin/verify');
          if (verifyRes.ok) {
            setIsAuthenticated(true);
          }
        } catch {
          setIsAuthenticated(true);
        }
      }
    } catch (err: unknown) {
      if (process.env.NODE_ENV !== 'production') console.error('Admin login error:', err);
      setError('حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  const isOrdersActive = pathname?.startsWith('/admin/orders');

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-on-background flex items-center justify-center font-poppins text-white">
        <div className="flex flex-col items-center justify-center">
          <span className="material-symbols-outlined text-[48px] animate-spin text-primary select-none mb-4">sync</span>
          <p className="text-sm opacity-70">جاري المصادقة...</p>
        </div>
      </div>
    );
  }

  // Email/Password gate view if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-on-background flex items-center justify-center p-4 font-poppins text-white">
        <div className="w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-md rounded-xl p-8 shadow-2xl text-center space-y-6">
          {/* Lock Icon */}
          <div className="w-16 h-16 bg-primary/10 rounded-full border border-primary/20 flex items-center justify-center text-primary mx-auto">
            <span
              className="material-symbols-outlined text-3xl select-none"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              admin_panel_settings
            </span>
          </div>

          <div>
            <h2 className="font-headline-md text-headline-md font-bold text-surface-bright tracking-tight">
              لوحة تحكم المسؤول
            </h2>
            <p className="text-surface-variant/60 text-xs mt-1.5 font-medium">
              أدخل بيانات اعتماد المسؤول لتسجيل الدخول.
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4 text-start">
            {/* Email Input */}
            <div className="space-y-2">
              <label className="font-label-sm text-label-sm text-surface-variant/80 block uppercase tracking-wider font-bold">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <input
                  type="email"
                  className="w-full bg-white/5 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-white font-sans disabled:opacity-50 text-left"
                  dir="ltr"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  autoFocus
                  required
                  disabled={isLoading}
                />
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-surface-variant/40 select-none text-[18px]">
                  mail
                </span>
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="font-label-sm text-label-sm text-surface-variant/80 block uppercase tracking-wider font-bold">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type="password"
                  className="w-full bg-white/5 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-white font-mono disabled:opacity-50 text-left"
                  dir="ltr"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  required
                  disabled={isLoading}
                />
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-surface-variant/40 select-none text-[18px]">
                  lock
                </span>
              </div>
              {error && (
                <p className="text-xs text-red-400 font-semibold mt-1">
                  🚨 {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || loginCooldown > 0}
              className="w-full bg-primary text-on-primary py-3.5 rounded-lg font-label-md text-sm hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer font-bold uppercase tracking-wider shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px] select-none">sync</span>
                  جاري المصادقة...
                </>
              ) : loginCooldown > 0 ? (
                <>
                  <span className="material-symbols-outlined text-[18px] select-none">timer</span>
                  انتظر {loginCooldown} ثانية
                </>
              ) : (
                'تسجيل الدخول'
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-white/5">
            <Link
              href="/"
              className="text-xs text-surface-variant hover:text-white transition-colors uppercase tracking-widest font-semibold"
            >
              العودة إلى المتجر
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Render full dashboard layout if authenticated
  return (
    <div className="min-h-screen bg-surface flex flex-col md:flex-row font-poppins text-on-surface">
      {/* Mobile Top Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-on-background text-white flex items-center justify-between px-6 z-50 shadow-md select-none print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-white hover:text-primary transition-colors flex items-center cursor-pointer border-0 bg-transparent p-0"
            aria-label="تبديل القائمة"
          >
            <span className="material-symbols-outlined text-[28px] select-none">
              {isSidebarOpen ? 'close' : 'menu'}
            </span>
          </button>
          <span className="font-bold text-sm tracking-tight uppercase">لوحة التحكم</span>
        </div>
      </header>

      {/* Backdrop overlay on mobile */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="md:hidden fixed inset-0 bg-black/60 z-30 backdrop-blur-sm print:hidden"
        />
      )}

      {/* Side Navbar */}
      <aside
        className={`fixed right-0 top-0 bottom-0 h-screen w-64 bg-on-background flex flex-col pt-20 pb-6 md:py-6 shadow-xl z-40 transition-transform duration-300 md:translate-x-0 print:hidden ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Brand/Logo Header */}
        <div className="px-6 mb-10 text-start">
          <h1 className="font-headline-md text-headline-md text-surface-bright tracking-tighter font-extrabold">
            لوحة التحكم
          </h1>
          <p className="text-surface-variant font-label-md text-label-md opacity-70">
            إدارة النظام
          </p>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 space-y-2 text-start">
          <Link
            href="/admin"
            onClick={() => setIsSidebarOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg mx-2 duration-200 ease-linear hover:scale-105 cursor-pointer ${
              pathname === '/admin' || pathname === '/admin/dashboard'
                ? 'bg-secondary text-on-secondary'
                : 'text-surface-variant hover:bg-surface-variant/10'
            }`}
          >
            <span className="material-symbols-outlined select-none">space_dashboard</span>
            <span className="font-label-md text-label-md">لوحة المعلومات</span>
          </Link>
          <Link
            href="/admin/orders"
            onClick={() => setIsSidebarOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg mx-2 duration-200 ease-linear hover:scale-105 cursor-pointer ${
              isOrdersActive
                ? 'bg-secondary text-on-secondary'
                : 'text-surface-variant hover:bg-surface-variant/10'
            }`}
          >
            <span className="material-symbols-outlined select-none">receipt_long</span>
            <span className="font-label-md text-label-md">الطلبات</span>
          </Link>
          <Link
            href="/admin/inventory"
            onClick={() => setIsSidebarOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg mx-2 duration-200 ease-linear hover:scale-105 cursor-pointer ${
              pathname === '/admin/inventory'
                ? 'bg-secondary text-on-secondary'
                : 'text-surface-variant hover:bg-surface-variant/10'
            }`}
          >
            <span className="material-symbols-outlined select-none">inventory_2</span>
            <span className="font-label-md text-label-md">المخزون</span>
          </Link>
        </nav>

        {/* Sidebar Footer */}
        <div className="mt-auto space-y-2 border-t border-surface-variant/10 pt-6">
          <div className="px-4 py-2">
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = '/admin';
              }}
              className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary py-2 px-4 rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity text-center cursor-pointer font-semibold uppercase tracking-wider border-0"
            >
              تسجيل الخروج
            </button>
          </div>
          <div className="px-4 pb-3">
            <Link
              href="/"
              className="w-full flex items-center justify-center gap-2 bg-surface-variant/10 text-surface-variant py-2 px-4 rounded-lg font-label-md text-label-md hover:bg-surface-variant/20 transition-all text-center cursor-pointer font-semibold uppercase tracking-wider text-xs border border-surface-variant/20"
            >
              عرض المتجر
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-grow min-h-screen ps-0 md:ps-64 pt-16 md:pt-0 print:ps-0 print:pt-0 print:min-h-0">
        <main className="p-margin-mobile md:p-margin-desktop min-h-screen text-start print:p-0 print:min-h-0">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
