'use client';

import { useEffect, useState } from 'react';
import { listNewsletterSubscribers } from '@/lib/adminApi';

export default function AdminNewsletterPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    listNewsletterSubscribers().then(setItems).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-semibold text-clinic-dark">Newsletter subscribers</h1>

      {loading && <p className="text-sm text-ink/50">Loading…</p>}
      {error && <p className="text-sm text-alert">{error}</p>}

      {!loading && !error && (
        items.length === 0 ? (
          <p className="text-sm text-ink/50">No subscribers yet.</p>
        ) : (
          <>
            <p className="mb-4 text-sm text-ink/60">{items.length} subscriber{items.length === 1 ? '' : 's'}</p>
            <div className="overflow-x-auto rounded-xl border border-ink/10 bg-white/60">
              <table className="w-full text-start text-sm">
                <thead>
                  <tr className="border-b border-ink/10 text-xs uppercase tracking-wider text-ink/40">
                    <th className="px-4 py-3 text-start font-medium">Email</th>
                    <th className="px-4 py-3 text-start font-medium">Language</th>
                    <th className="px-4 py-3 text-start font-medium">Subscribed</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((s) => (
                    <tr key={s.id} className="border-b border-ink/5 last:border-0">
                      <td className="px-4 py-3 text-ink/80">{s.email}</td>
                      <td className="px-4 py-3 uppercase text-ink/60">{s.locale}</td>
                      <td className="px-4 py-3 text-ink/80">{String(s.subscribed_at).slice(0, 10)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )
      )}
    </div>
  );
}
