'use client';

import React, { memo, useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '@/hooks/useCart';
import { useHydrated } from '@/hooks/useHydrated';
import { supabase } from '@/lib/supabase/client';
import { isAdminRole } from '@/lib/constants';

export const Navbar = memo(function Navbar() {
  const { itemCount } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [searchQuery, setSearchQuery] = useState(() => searchParams?.get('search') || '');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMounted = useHydrated();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const searchRef = useRef(searchQuery);

  useEffect(() => {
    searchRef.current = searchQuery;
  }, [searchQuery]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (session) {
          const { data: { user } } = await supabase.auth.getUser();
          setIsAdmin(isAdminRole(user?.app_metadata?.role));
        } else {
          setIsAdmin(false);
        }
      } catch {
        setIsAdmin(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileMenuOpen]);

  const searchParam = searchParams.get('search');
  const isOnShop = pathname.startsWith('/shop');

  useEffect(() => {
    setSearchQuery((current) => {
      const next = searchParam ?? '';
      return current === next ? current : next;
    });
  }, [searchParam]);

  const shopReplaceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (isOnShop) {
      if (shopReplaceTimer.current) clearTimeout(shopReplaceTimer.current);
      shopReplaceTimer.current = setTimeout(() => {
        const params = new URLSearchParams(window.location.search);
        if (value.trim()) params.set('search', value.trim());
        else params.delete('search');
        const newUrl = `${pathname}?${params.toString()}`;
        window.history.replaceState(null, '', newUrl);
      }, 150);
    }
  }, [isOnShop, pathname]);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchRef.current.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchRef.current.trim())}`);
    } else {
      router.push('/shop');
    }
  }, [router]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    if (isOnShop) {
      const params = new URLSearchParams(window.location.search);
      params.delete('search');
      const newUrl = `${pathname}?${params.toString()}`;
      window.history.replaceState(null, '', newUrl);
    }
  }, [isOnShop, pathname]);

  useEffect(() => {
    if (shopReplaceTimer.current) clearTimeout(shopReplaceTimer.current);
  }, [isOnShop]);

  const isHomeActive = pathname === '/';
  const isShopActive = pathname.startsWith('/shop');
  const isTrackActive = pathname.startsWith('/track');
  const isSupportActive = pathname.startsWith('/support');

  return (
    <header className="sticky top-0 w-full z-50 transition-all duration-300">
      {/* Main Nav Container */}

      <nav className={`w-full bg-white/90 backdrop-blur-md border-b border-outline-variant/15 premium-transition ${isScrolled ? 'premium-shadow-lg' : 'shadow-sm'}`}>
        
        {/* Main Row: Logo, Search Bar, Actions */}
        <div className="max-w-max-width mx-auto flex items-center justify-between px-margin-mobile md:px-margin-desktop py-3.5 gap-6">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-95 transition-opacity shrink-0 group">
             <div className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-primary/5 rounded-xl border border-primary/10 group-hover:border-primary/20 transition-all">
               <Image
                  alt="شعار إلكترو توب"
                  className="h-7 w-auto object-contain mix-blend-multiply"
                  src="/logo.png"
                  width={120}
                  height={32}
                />
             </div>
            <div className="flex flex-col">
              <span className="font-headline-md text-headline-md font-extrabold text-primary tracking-tighter leading-none">
                إلكترو توب
              </span>
              <span className="text-[10px] text-on-surface-variant/70 font-semibold tracking-wider">
                مستلزمات ومعدات كهربائية
              </span>
            </div>
          </Link>

          {/* Centered Wide Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative flex-grow max-w-xl hidden md:block">
            <label htmlFor="navbar-search" className="sr-only">بحث عن المنتجات</label>

            <div className="relative flex items-center w-full">
              <input
                id="navbar-search"
                className="w-full bg-surface-container-low border border-outline-variant/40 rounded-full pr-11 pl-10 py-2.5 text-label-md focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-on-surface text-start placeholder:text-on-surface-variant/50"
                placeholder="ابحث عن أسلاك السويدي، كابلات، قواطع ميتسوبيشي، هيمل..."
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 select-none pointer-events-none text-[20px]">
                search
              </span>
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-primary transition-colors flex items-center justify-center p-1 rounded-full cursor-pointer"
                  aria-label="مسح البحث"
                >
                  <span className="material-symbols-outlined text-[18px]">cancel</span>
                </button>
              )}
            </div>
          </form>

          {/* Icons & Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {isMounted && isAdmin && (
              <Link
                href="/admin"
                className="font-label-md text-label-sm text-primary bg-primary/10 border border-primary/20 px-3.5 py-2 rounded-full hover:bg-primary/15 transition-all font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                <span className="hidden sm:inline">لوحة التحكم</span>
              </Link>
            )}

            <Link
              href="/cart"
              className="relative hover:opacity-90 transition-all flex items-center justify-center w-11 h-11 rounded-full bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 cursor-pointer shadow-sm"
              aria-label={`سلة التسوق${itemCount > 0 ? ` - ${itemCount} منتجات` : ''}`}
            >
              <span className="material-symbols-outlined text-primary text-[24px] select-none" aria-hidden="true">
                shopping_bag
              </span>
              {isMounted && itemCount > 0 && (
                <span
                  key={itemCount}
                  className="absolute -top-1 -end-1 bg-primary text-on-primary text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-cart-badge shadow-md font-mono tabular-nums border border-white"
                >
                  {itemCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-on-surface hover:text-primary transition-colors flex items-center justify-center w-11 h-11 rounded-full bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label={isMobileMenuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
            >
              <span className="material-symbols-outlined text-[24px] select-none">
                {isMobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>

        {/* Navigation Links Row */}
        <div className="hidden md:block border-t border-outline-variant/10 bg-white/60">
          <div className="max-w-max-width mx-auto flex justify-center items-center gap-10 py-2.5">
            <Link
              href="/"
              aria-current={isHomeActive ? 'page' : undefined}
              className={`font-label-md text-sm font-semibold transition-colors duration-200 pb-1.5 ${
                isHomeActive
                  ? 'text-primary active-nav-glow font-bold'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              الرئيسية
            </Link>
            <Link
              href="/shop"
              aria-current={isShopActive ? 'page' : undefined}
              className={`font-label-md text-sm font-semibold transition-colors duration-200 pb-1.5 ${
                isShopActive
                  ? 'text-primary active-nav-glow font-bold'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              المتجر والمنتجات
            </Link>
            <Link
              href="/track"
              aria-current={isTrackActive ? 'page' : undefined}
              className={`font-label-md text-sm font-semibold transition-colors duration-200 pb-1.5 ${
                isTrackActive
                  ? 'text-primary active-nav-glow font-bold'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              تتبع حالة الطلب
            </Link>
            <Link
              href="/support"
              aria-current={isSupportActive ? 'page' : undefined}
              className={`font-label-md text-sm font-semibold transition-colors duration-200 pb-1.5 ${
                isSupportActive
                  ? 'text-primary active-nav-glow font-bold'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              الدعم والمساعدة
            </Link>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div
            id="mobile-menu"
            className="md:hidden bg-white border-t border-outline-variant/15 py-5 px-margin-mobile space-y-4 shadow-xl"
            style={{ animation: 'slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
          >
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <label htmlFor="navbar-mobile-search" className="sr-only">بحث عن المنتجات</label>
              <input
                id="navbar-mobile-search"
                className="w-full bg-surface-container-low border border-outline-variant/40 rounded-full pr-10 pl-4 py-2.5 text-label-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-on-surface text-start placeholder:text-on-surface-variant/50"
                placeholder="ابحث عن منتج، كابل، أو قاطع..."
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
              <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 select-none text-[20px]">
                search
              </span>
            </form>

            {/* Links List */}
            <div className="flex flex-col gap-1.5 text-start pt-1">
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`font-label-md text-label-md py-3 px-3.5 rounded-xl flex items-center justify-between transition-colors ${
                  isHomeActive ? 'text-primary font-bold bg-primary/10' : 'text-on-surface hover:bg-surface-container-low'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[20px]">home</span>
                  <span>الرئيسية</span>
                </div>
                <span className="material-symbols-outlined text-xs rotate-180 opacity-50">arrow_back_ios</span>
              </Link>

              <Link
                href="/shop"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`font-label-md text-label-md py-3 px-3.5 rounded-xl flex items-center justify-between transition-colors ${
                  isShopActive ? 'text-primary font-bold bg-primary/10' : 'text-on-surface hover:bg-surface-container-low'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[20px]">storefront</span>
                  <span>المتجر والمنتجات</span>
                </div>
                <span className="material-symbols-outlined text-xs rotate-180 opacity-50">arrow_back_ios</span>
              </Link>

              <Link
                href="/track"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`font-label-md text-label-md py-3 px-3.5 rounded-xl flex items-center justify-between transition-colors ${
                  isTrackActive ? 'text-primary font-bold bg-primary/10' : 'text-on-surface hover:bg-surface-container-low'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[20px]">local_shipping</span>
                  <span>تتبع حالة الطلب</span>
                </div>
                <span className="material-symbols-outlined text-xs rotate-180 opacity-50">arrow_back_ios</span>
              </Link>

              <Link
                href="/support"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`font-label-md text-label-md py-3 px-3.5 rounded-xl flex items-center justify-between transition-colors ${
                  isSupportActive ? 'text-primary font-bold bg-primary/10' : 'text-on-surface hover:bg-surface-container-low'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[20px]">help</span>
                  <span>الدعم والمساعدة</span>
                </div>
                <span className="material-symbols-outlined text-xs rotate-180 opacity-50">arrow_back_ios</span>
              </Link>
            </div>
          </div>
        )}

      </nav>
    </header>
  );
});

Navbar.displayName = 'Navbar';

