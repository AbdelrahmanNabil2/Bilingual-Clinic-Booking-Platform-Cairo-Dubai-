'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { restoreSession, adminLogout, getCurrentAdmin } from '@/lib/adminApi';

const NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/appointments', label: 'Appointments' },
  { href: '/admin/waitlist', label: 'Waitlist' },
  { href: '/admin/news', label: 'News' },
  { href: '/admin/services', label: 'Services' },
  { href: '/admin/doctors', label: 'Doctors' },
  { href: '/admin/locations', label: 'Locations' },
  { href: '/admin/closures', label: 'Closures' },
  { href: '/admin/testimonials', label: 'Testimonials' },
  { href: '/admin/newsletter', label: 'Newsletter' },
  { href: '/admin/settings', label: 'Settings' }
];

export default function AdminShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginOrReset = pathname === '/admin/login' || pathname.startsWith('/admin/reset-password');
  const [admin, setAdmin] = useState(null);
  const [checking, setChecking] = useState(!isLoginOrReset);

  useEffect(() => {
    if (isLoginOrReset) return;
    restoreSession().then((a) => {
      if (!a) {
        router.replace('/admin/login');
        return;
      }
      setAdmin(a);
      setChecking(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, isLoginOrReset]);

  if (isLoginOrReset) return children;

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base text-sm text-ink/50">
        Loading…
      </div>
    );
  }

  async function handleLogout() {
    await adminLogout();
    router.replace('/admin/login');
  }

  return (
    <div className="flex min-h-screen bg-base">
      <aside className="hidden w-60 shrink-0 border-e border-ink/10 bg-sand/40 p-6 md:block">
        <p className="font-display text-lg font-semibold text-clinic-dark">Clinic Admin</p>
        <nav className="mt-8 space-y-1">
          {NAV.map((item) => {
            const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`focus-ring block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active ? 'bg-clinic text-base' : 'text-ink/70 hover:bg-white'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-ink/10 bg-white/60 px-6 py-4">
          <p className="text-sm text-ink/60">
            Signed in as <span className="font-medium text-ink">{(admin || getCurrentAdmin())?.name}</span>
            <span className="ms-2 rounded-full bg-ink/10 px-2 py-0.5 text-xs font-medium capitalize text-ink/60">
              {(admin || getCurrentAdmin())?.role}
            </span>
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="focus-ring rounded-full border border-ink/15 px-4 py-1.5 text-sm font-medium text-ink/70 transition-colors hover:border-clinic hover:text-clinic"
          >
            Log out
          </button>
        </header>
        <main className="p-6 md:p-10">{children}</main>
      </div>
    </div>
  );
}
