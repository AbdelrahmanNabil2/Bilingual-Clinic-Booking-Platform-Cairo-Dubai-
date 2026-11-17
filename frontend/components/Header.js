'use client';

import { useState } from 'react';
import Link from 'next/link';

const NAV_ITEMS = [
  { key: 'home', href: '' },
  { key: 'services', href: '/services' },
  { key: 'doctors', href: '/doctors' },
  { key: 'locations', href: '/locations' },
  { key: 'news', href: '/news' },
  { key: 'about', href: '/about' },
  { key: 'contact', href: '/contact' }
];

export default function Header({ locale, messages }) {
  const [open, setOpen] = useState(false);
  const otherLocale = locale === 'en' ? 'ar' : 'en';

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-base/95 backdrop-blur">
      <div className="mx-auto flex max-w-content items-center justify-between px-5 py-4 md:px-8">
        <Link
          href={`/${locale}`}
          className="focus-ring rounded font-display text-xl font-semibold tracking-tight text-clinic"
        >
          {messages.meta.siteName}
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              href={`/${locale}${item.href}`}
              className="focus-ring rounded text-sm font-medium text-ink/80 transition-colors hover:text-clinic"
            >
              {messages.nav[item.key]}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href={`/${locale}/search`}
            aria-label="Search"
            className="focus-ring rounded-full p-2 text-ink/60 transition-colors hover:text-clinic"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </Link>
          <LanguageToggle locale={locale} otherLocale={otherLocale} />
          <Link
            href={`/${locale}/booking`}
            className="focus-ring rounded-full bg-clinic px-5 py-2 text-sm font-medium text-base transition-colors hover:bg-clinic-dark"
          >
            {messages.nav.bookVisit}
          </Link>
        </div>

        <button
          type="button"
          className="focus-ring rounded p-2 md:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="block h-0.5 w-6 bg-ink" />
          <span className="mt-1.5 block h-0.5 w-6 bg-ink" />
          <span className="mt-1.5 block h-0.5 w-6 bg-ink" />
        </button>
      </div>

      {open && (
        <div className="border-t border-ink/10 bg-base px-5 pb-5 md:hidden">
          <nav className="flex flex-col gap-1 pt-3">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.key}
                href={`/${locale}${item.href}`}
                className="focus-ring rounded px-1 py-2 text-sm font-medium text-ink/80 hover:text-clinic"
                onClick={() => setOpen(false)}
              >
                {messages.nav[item.key]}
              </Link>
            ))}
            <Link
              key="search"
              href={`/${locale}/search`}
              className="focus-ring rounded px-1 py-2 text-sm font-medium text-ink/80 hover:text-clinic"
              onClick={() => setOpen(false)}
            >
              {messages.search.title}
            </Link>
            <Link
              href={`/${locale}/booking`}
              className="focus-ring mt-2 rounded-full bg-clinic px-5 py-2 text-center text-sm font-medium text-base"
              onClick={() => setOpen(false)}
            >
              {messages.nav.bookVisit}
            </Link>
            <div className="mt-3">
              <LanguageToggle locale={locale} otherLocale={otherLocale} />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

function LanguageToggle({ locale, otherLocale }) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-ink/15 p-1 font-mono text-xs">
      <Link
        href="/en"
        className={`focus-ring rounded-full px-2.5 py-1 transition-colors ${
          locale === 'en' ? 'bg-clinic text-base' : 'text-ink/60 hover:text-ink'
        }`}
      >
        EN
      </Link>
      <Link
        href="/ar"
        className={`focus-ring rounded-full px-2.5 py-1 transition-colors ${
          locale === 'ar' ? 'bg-clinic text-base' : 'text-ink/60 hover:text-ink'
        }`}
      >
        ع
      </Link>
    </div>
  );
}
