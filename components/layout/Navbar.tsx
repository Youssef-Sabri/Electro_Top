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

  useEffect(() => {
    if (shopReplaceTimer.current) clearTimeout(shopReplaceTimer.current);
  }, [isOnShop]);

  const isHomeActive = pathname === '/';
  const isTrackActive = pathname.startsWith('/track');

  return (
    <header className="sticky top-0 w-full z-50 transition-shadow duration-300">
      {/* Main Nav Container */}
      <nav className={`w-full bg-white/85 backdrop-blur-md border-b border-outline-variant/10 premium-transition ${isScrolled ? 'premium-shadow' : 'shadow-sm'}`}>
        
        {/* Tier 2: Logo, Search Bar, Icons */}
        <div className="max-w-max-width mx-auto flex items-center justify-between px-margin-mobile md:px-margin-desktop py-4 gap-6">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity shrink-0">
             <Image
                alt="شعار إلكترو توب"
                className="h-8 w-auto mix-blend-multiply"
                src="/logo.png"
                width={120}
                height={32}
              />
            <span className="font-headline-md text-headline-md font-extrabold text-primary tracking-tighter">
              إلكترو توب
            </span>
          </Link>

          {/* Centered Wide Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative flex-grow max-w-xl hidden md:block">
            <label htmlFor="navbar-search" className="sr-only">بحث عن المنتجات</label>
            <input
              id="navbar-search"
              className="w-full bg-surface-container-low border border-outline-variant/50 rounded-full pr-11 pl-4 py-2.5 text-label-md focus:ring-2 focus:ring-primary/15 focus:border-primary outline-none transition-all text-on-surface text-start"
              placeholder="البحث عن المنتجات والمستلزمات الكهربائية..."
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant select-none pointer-events-none">
              search
            </span>
          </form>

          {/* Icons & Actions */}
          <div className="flex items-center gap-4 shrink-0">
            {isMounted && isAdmin && (
              <Link
                href="/admin"
                className="font-label-md text-label-sm text-primary bg-primary/5 border border-primary/20 px-3.5 py-2 rounded-full hover:bg-primary/10 transition-all font-semibold flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                <span className="hidden sm:inline">لوحة التحكم</span>
              </Link>
            )}

            <Link href="/cart" className="relative hover:opacity-85 transition-all flex items-center p-2 rounded-full hover:bg-surface-container-low" aria-label={`سلة التسوق${itemCount > 0 ? ` - ${itemCount} منتجات` : ''}`}>
              <span className="material-symbols-outlined text-primary text-[28px] select-none" aria-hidden="true">
                shopping_cart
              </span>
              {isMounted && itemCount > 0 && (
                <span
                  key={itemCount}
                  className="absolute -top-1.5 -end-1.5 bg-primary text-on-primary text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-cart-badge shadow-sm"
                >
                  {itemCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-on-surface hover:text-primary transition-colors flex items-center p-2 rounded-full hover:bg-surface-container-low cursor-pointer"
              aria-label={isMobileMenuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
            >
              <span className="material-symbols-outlined text-[28px] select-none">
                {isMobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>

        {/* Tier 3: Centered Link Row */}
        <div className="hidden md:block border-t border-outline-variant/10 bg-white/40">
          <div className="max-w-max-width mx-auto flex justify-center items-center gap-10 py-3">
            <Link
              href="/"
              aria-current={isHomeActive ? 'page' : undefined}
              className={`font-label-md text-sm font-semibold transition-colors duration-[250ms] pb-1 ${
                isHomeActive
                  ? 'text-primary active-nav-glow'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              الرئيسية
            </Link>
            <Link
              href="/shop"
              aria-current={pathname.startsWith('/shop') ? 'page' : undefined}
              className={`font-label-md text-sm font-semibold transition-colors duration-[250ms] pb-1 ${
                pathname.startsWith('/shop')
                  ? 'text-primary active-nav-glow'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              المتجر
            </Link>
            <Link
              href="/track"
              aria-current={isTrackActive ? 'page' : undefined}
              className={`font-label-md text-sm font-semibold transition-colors duration-[250ms] pb-1 ${
                isTrackActive
                  ? 'text-primary active-nav-glow'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              تتبع الطلب
            </Link>
            <Link
              href="/support"
              aria-current={pathname.startsWith('/support') ? 'page' : undefined}
              className={`font-label-md text-sm font-semibold transition-colors duration-[250ms] pb-1 ${
                pathname.startsWith('/support')
                  ? 'text-primary active-nav-glow'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              الدعم
            </Link>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {isMobileMenuOpen && (
          <div id="mobile-menu" className="md:hidden bg-white border-t border-outline-variant/10 py-4 px-margin-mobile space-y-4"
            style={{ animation: 'slideDown 0.2s ease-out forwards' }}
          >
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <label htmlFor="navbar-mobile-search" className="sr-only">بحث عن المنتجات</label>
              <input
                id="navbar-mobile-search"
                className="w-full bg-surface-container-low border border-outline-variant/50 rounded-full pr-10 pl-4 py-2 text-label-md focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all text-on-surface text-start"
                placeholder="البحث عن المنتجات..."
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
              <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant select-none">
                search
              </span>
            </form>
            <div className="flex flex-col gap-2.5 text-start">
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`font-label-md text-label-md py-2 px-1 rounded-lg ${
                  isHomeActive ? 'text-primary font-bold bg-primary/5' : 'text-on-surface-variant hover:bg-surface-container-low'
                }`}
              >
                الرئيسية
              </Link>
              <Link
                href="/shop"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`font-label-md text-label-md py-2 px-1 rounded-lg ${
                  pathname.startsWith('/shop') ? 'text-primary font-bold bg-primary/5' : 'text-on-surface-variant hover:bg-surface-container-low'
                }`}
              >
                المتجر
              </Link>
              <Link
                href="/track"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`font-label-md text-label-md py-2 px-1 rounded-lg ${
                  isTrackActive ? 'text-primary font-bold bg-primary/5' : 'text-on-surface-variant hover:bg-surface-container-low'
                }`}
              >
                تتبع الطلب
              </Link>
              <Link
                href="/support"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`font-label-md text-label-md py-2 px-1 rounded-lg ${
                  pathname.startsWith('/support') ? 'text-primary font-bold bg-primary/5' : 'text-on-surface-variant hover:bg-surface-container-low'
                }`}
              >
                الدعم
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
});
