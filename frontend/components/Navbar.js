'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { ROLE } from '@/lib/format';

export default function Navbar() {
  const { user, unread, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const path = usePathname();

  const links = [{ href: '/cars', label: 'Каталог' }];
  if (user) {
    links.push({ href: '/favorites', label: 'Избранное' });
    links.push({ href: '/messages', label: 'Сообщения', badge: unread });
    links.push({ href: '/reservations', label: 'Брони' });
    if (user.role !== 'buyer') links.push({ href: '/seller', label: 'Мои объявления' });
    if (user.role === 'admin') links.push({ href: '/admin', label: 'Админка' });
  }

  return (
    <header className="sticky top-0 z-30 bg-ink text-white">
      <div className="container-page flex h-14 items-center gap-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-extrabold" onClick={() => setOpen(false)}>
          <span className="rounded-sm bg-plate px-1.5 py-0.5 text-sm font-black text-ink">AM</span>
          AutoMarket
        </Link>
        <nav className={`${open ? 'flex' : 'hidden'} absolute left-0 right-0 top-14 flex-col gap-1 bg-ink px-4 pb-4 md:static md:flex md:flex-1 md:flex-row md:gap-5 md:p-0`}>
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
              className={`flex items-center gap-1.5 py-1.5 text-sm font-medium hover:text-plate ${path.startsWith(l.href) ? 'text-plate' : 'text-white/85'}`}>
              {l.label}
              {l.badge > 0 && <span className="rounded-full bg-plate px-1.5 text-xs font-bold text-ink">{l.badge}</span>}
            </Link>
          ))}
          <div className="mt-2 flex items-center gap-3 md:ml-auto md:mt-0">
            {user ? (
              <>
                <span className="text-sm text-white/80">{user.name} <span className="text-white/50">({ROLE[user.role]})</span></span>
                <button className="btn bg-white/10 text-white hover:bg-white/20" onClick={() => { setOpen(false); logout(); }}>Выйти</button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)} className="text-sm font-medium text-white/85 hover:text-plate">Войти</Link>
                <Link href="/register" onClick={() => setOpen(false)} className="btn-accent">Регистрация</Link>
              </>
            )}
          </div>
        </nav>
        <button className="ml-auto grid h-9 w-9 place-items-center rounded md:hidden" aria-label="Меню" aria-expanded={open} onClick={() => setOpen(!open)}>
          <svg viewBox="0 0 24 24" className="h-6 w-6" stroke="currentColor" strokeWidth="2" fill="none"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
        </button>
      </div>
    </header>
  );
}
