'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getMessages } from '@/lib/getMessages';
import { siteSearch } from '@/lib/api';

export default function SearchClient({ locale }) {
  const t = getMessages(locale);
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';

  const [query, setQuery] = useState(q);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setQuery(q);
    if (q.length < 2) { setResults(null); return; }
    setLoading(true);
    siteSearch(q).then(setResults).finally(() => setLoading(false));
  }, [q]);

  function handleSubmit(e) {
    e.preventDefault();
    const url = new URL(window.location.href);
    url.searchParams.set('q', query);
    window.history.pushState({}, '', url);
    if (query.length >= 2) {
      setLoading(true);
      siteSearch(query).then(setResults).finally(() => setLoading(false));
    }
  }

  return (
    <div className="mx-auto max-w-content px-5 py-16 md:px-8">
      <h1 className="font-display text-3xl font-semibold text-clinic-dark">{t.search.title}</h1>

      <form onSubmit={handleSubmit} className="mt-6 max-w-md">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.search.placeholder}
          className="focus-ring w-full rounded-full border border-ink/15 bg-white px-5 py-3 text-sm"
        />
      </form>

      <div className="mt-10">
        {query.length < 2 && <p className="text-sm text-ink/50">{t.search.prompt}</p>}
        {loading && <p className="text-sm text-ink/50">…</p>}

        {results && !loading && (
          <>
            {results.news.length === 0 && results.services.length === 0 && (
              <p className="text-sm text-ink/50">{t.search.noResults}</p>
            )}

            {results.news.length > 0 && (
              <div className="mb-10">
                <h2 className="mb-4 font-mono text-xs uppercase tracking-wider text-ink/40">{t.search.newsResults}</h2>
                <div className="space-y-4">
                  {results.news.map((n) => (
                    <Link
                      key={n.slug}
                      href={`/${locale}/news/${n.slug}`}
                      className="focus-ring block rounded-xl border border-ink/10 bg-white/60 p-4 hover:shadow-md"
                    >
                      <p className="font-display font-medium text-clinic-dark">
                        {locale === 'ar' ? n.title_ar : n.title_en}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {results.services.length > 0 && (
              <div>
                <h2 className="mb-4 font-mono text-xs uppercase tracking-wider text-ink/40">{t.search.serviceResults}</h2>
                <div className="space-y-4">
                  {results.services.map((s) => (
                    <div key={s.id} className="rounded-xl border border-ink/10 bg-white/60 p-4">
                      <p className="font-display font-medium text-clinic-dark">
                        {locale === 'ar' ? s.title_ar : s.title_en}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
