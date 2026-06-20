'use client';

import React, { memo, useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '@/hooks/useCart';
import { supabase } from '@/lib/supabase';

export const Navbar = memo(function Navbar() {
  const { itemCount } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const searchRef = useRef(searchQuery);
  searchRef.current = searchQuery;

  useEffect(() => {
    setIsMounted(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAdmin(!!session);
    });
  }, []);

  const searchParam = searchParams.get('search');

  useEffect(() => {
    setSearchQuery((current) => {
      const next = searchParam ?? '';
      return current === next ? current : next;
    });
  }, [searchParam]);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchRef.current.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchRef.current.trim())}`);
    } else {
      router.push('/shop');
    }
  }, [router]);

  const isHomeActive = pathname === '/';
  const isTrackActive = pathname.startsWith('/track');

  return (
    <nav className="sticky top-0 w-full z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant/30 shadow-sm">
      <div className="max-w-max-width mx-auto flex justify-between items-center px-margin-desktop py-4">
        <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
           <Image
             alt="شعار إلكترو توب"
             className="h-8 w-auto mix-blend-multiply"
             src="/logo.jpg"
             width={32}
             height={32}
             style={{ width: 'auto' }}
             fetchPriority="high"
             priority
           />
          <span className="font-headline-md text-headline-md font-extrabold text-primary tracking-tighter">
            إلكترو توب
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/"
            className={`font-label-md text-label-md duration-300 ease-in-out ${
              isHomeActive
                ? 'text-primary border-b-2 border-primary'
                : 'text-on-surface-variant hover:text-primary transition-opacity'
            }`}
          >
            الرئيسية
          </Link>
          <Link
            href="/shop"
            className={`font-label-md text-label-md duration-300 ease-in-out ${
              pathname.startsWith('/shop')
                ? 'text-primary border-b-2 border-primary'
                : 'text-on-surface-variant hover:text-primary transition-opacity'
            }`}
          >
            المتجر
          </Link>
          <Link
            href="/track"
            className={`font-label-md text-label-md duration-300 ease-in-out ${
              isTrackActive
                ? 'text-primary border-b-2 border-primary'
                : 'text-on-surface-variant hover:text-primary transition-opacity'
            }`}
          >
            تتبع الطلب
          </Link>
          <Link
            href="/support"
            className={`font-label-md text-label-md duration-300 ease-in-out ${
              pathname.startsWith('/support')
                ? 'text-primary border-b-2 border-primary'
                : 'text-on-surface-variant hover:text-primary transition-opacity'
            }`}
          >
            الدعم
          </Link>
          {isMounted && isAdmin && (
            <Link
              href="/admin"
              className="font-label-md text-label-md text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-all font-semibold uppercase tracking-wider text-xs flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
              لوحة التحكم
            </Link>
          )}
        </div>

        <div className="flex items-center gap-6">
          <form onSubmit={handleSearchSubmit} className="relative hidden lg:block">
            <input
              className="bg-surface-container-low border border-outline-variant rounded-lg pr-10 pl-4 py-2 text-label-md focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all text-on-surface text-right"
              placeholder="البحث عن المنتجات..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant select-none">
              search
            </span>
          </form>

          <Link href="/cart" className="relative hover:opacity-80 transition-opacity flex items-center">
            <span className="material-symbols-outlined text-primary text-[28px] select-none">
              shopping_cart
            </span>
            {isMounted && itemCount > 0 && (
              <span className="absolute -top-2 -end-2 bg-primary text-on-primary text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-on-surface hover:text-primary transition-colors flex items-center cursor-pointer"
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined text-[28px] select-none">
              {isMobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-surface border-t border-outline-variant/30 py-4 px-margin-mobile space-y-4"
          style={{ animation: 'slideDown 0.2s ease-out forwards' }}
        >
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg pr-10 pl-4 py-2 text-label-md focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all text-on-surface text-right"
              placeholder="البحث عن المنتجات..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant select-none">
              search
            </span>
          </form>
          <div className="flex flex-col gap-3 text-start">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`font-label-md text-label-md py-2 ${
                isHomeActive ? 'text-primary font-bold' : 'text-on-surface-variant'
              }`}
            >
              الرئيسية
            </Link>
            <Link
              href="/shop"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`font-label-md text-label-md py-2 ${
                pathname.startsWith('/shop') ? 'text-primary font-bold' : 'text-on-surface-variant'
              }`}
            >
              المتجر
            </Link>
            <Link
              href="/track"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`font-label-md text-label-md py-2 ${
                isTrackActive ? 'text-primary font-bold' : 'text-on-surface-variant'
              }`}
            >
              تتبع الطلب
            </Link>
            <Link
              href="/support"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`font-label-md text-label-md py-2 ${
                pathname.startsWith('/support') ? 'text-primary font-bold' : 'text-on-surface-variant'
              }`}
            >
              الدعم
            </Link>
            {isMounted && isAdmin && (
              <Link
                href="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className="font-label-md text-label-md py-2 text-primary font-bold border-t border-outline-variant/20 mt-2 pt-3 flex items-center gap-1.5 animate-fade-in-up"
              >
                <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                لوحة التحكم
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
});
