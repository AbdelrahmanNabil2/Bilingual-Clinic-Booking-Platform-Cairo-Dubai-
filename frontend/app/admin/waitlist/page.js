'use client';

import { useEffect, useState } from 'react';
import { listWaitlist } from '@/lib/adminApi';

export default function AdminWaitlistPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    listWaitlist().then(setItems).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-semibold text-clinic-dark">Waitlist</h1>
      <p className="mb-6 text-sm text-ink/60">
        Patients waiting for a slot to open up. They&apos;re emailed automatically the moment a matching appointment is cancelled.
      </p>

      {loading && <p className="text-sm text-ink/50">Loading…</p>}
      {error && <p className="text-sm text-alert">{error}</p>}

      {!loading && !error && (
        items.length === 0 ? (
          <p className="text-sm text-ink/50">No one is waiting right now.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-ink/10 bg-white/60">
            <table className="w-full text-start text-sm">
              <thead>
                <tr className="border-b border-ink/10 text-xs uppercase tracking-wider text-ink/40">
                  <th className="px-4 py-3 text-start font-medium">Patient</th>
                  <th className="px-4 py-3 text-start font-medium">Contact</th>
                  <th className="px-4 py-3 text-start font-medium">Location</th>
                  <th className="px-4 py-3 text-start font-medium">Requested date</th>
                  <th className="px-4 py-3 text-start font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((w) => (
                  <tr key={w.id} className="border-b border-ink/5 last:border-0">
                    <td className="px-4 py-3 text-ink/80">{w.patient_name}</td>
                    <td className="px-4 py-3 text-ink/60">
                      <div>{w.email}</div>
                      {w.phone && <div className="text-xs">{w.phone}</div>}
                    </td>
                    <td className="px-4 py-3 text-ink/80">{w.location_city_en}</td>
                    <td className="px-4 py-3 text-ink/80">{String(w.requested_date).slice(0, 10)}</td>
                    <td className="px-4 py-3">
                      {w.notified_at ? (
                        <span className="rounded-full bg-clinic/10 px-2.5 py-1 text-xs font-medium text-clinic-dark">Notified</span>
                      ) : (
                        <span className="rounded-full bg-ink/10 px-2.5 py-1 text-xs font-medium text-ink/60">Waiting</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
