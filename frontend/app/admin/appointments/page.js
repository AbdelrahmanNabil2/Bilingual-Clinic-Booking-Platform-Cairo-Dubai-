'use client';

import { useEffect, useState } from 'react';
import { listAppointments, updateAppointmentStatus } from '@/lib/adminApi';

const STATUSES = ['confirmed', 'cancelled', 'completed'];

export default function AdminAppointmentsPage() {
  const [filters, setFilters] = useState({ date: '', location: '', status: '' });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  function load() {
    setLoading(true);
    listAppointments(filters)
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  async function handleStatusChange(id, status) {
    try {
      await updateAppointmentStatus(id, status);
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-semibold text-clinic-dark">Appointments</h1>

      <div className="mb-6 flex flex-wrap gap-3">
        <input
          type="date"
          value={filters.date}
          onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value }))}
          className="focus-ring rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm"
        />
        <select
          value={filters.location}
          onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value }))}
          className="focus-ring rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm"
        >
          <option value="">All locations</option>
          <option value="cairo">Cairo</option>
          <option value="dubai">Dubai</option>
        </select>
        <select
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          className="focus-ring rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {(filters.date || filters.location || filters.status) && (
          <button
            type="button"
            onClick={() => setFilters({ date: '', location: '', status: '' })}
            className="focus-ring rounded-lg px-3 py-2 text-sm text-ink/50 hover:text-ink"
          >
            Clear filters
          </button>
        )}
      </div>

      {loading && <p className="text-sm text-ink/50">Loading…</p>}
      {error && <p className="text-sm text-alert">{error}</p>}

      {!loading && !error && (
        items.length === 0 ? (
          <p className="text-sm text-ink/50">No appointments match these filters.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-ink/10 bg-white/60">
            <table className="w-full text-start text-sm">
              <thead>
                <tr className="border-b border-ink/10 text-xs uppercase tracking-wider text-ink/40">
                  <th className="px-4 py-3 text-start font-medium">Patient</th>
                  <th className="px-4 py-3 text-start font-medium">Contact</th>
                  <th className="px-4 py-3 text-start font-medium">Location</th>
                  <th className="px-4 py-3 text-start font-medium">Date</th>
                  <th className="px-4 py-3 text-start font-medium">Time</th>
                  <th className="px-4 py-3 text-start font-medium">Status</th>
                  <th className="px-4 py-3 text-end font-medium">Change status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((a) => (
                  <tr key={a.id} className="border-b border-ink/5 align-top last:border-0">
                    <td className="px-4 py-3 text-ink/80">{a.patient_name}</td>
                    <td className="px-4 py-3 text-ink/60">
                      <div>{a.email}</div>
                      {a.phone && <div className="text-xs">{a.phone}</div>}
                    </td>
                    <td className="px-4 py-3 text-ink/80">{a.location_city_en}</td>
                    <td className="px-4 py-3 text-ink/80">{String(a.appointment_date).slice(0, 10)}</td>
                    <td className="px-4 py-3 font-mono text-ink/80">{String(a.appointment_time).slice(0, 5)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="px-4 py-3 text-end">
                      <select
                        value={a.status}
                        onChange={(e) => handleStatusChange(a.id, e.target.value)}
                        className="focus-ring rounded-lg border border-ink/15 bg-white px-2 py-1 text-xs"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
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

function StatusBadge({ status }) {
  const colors = {
    confirmed: 'bg-clinic/10 text-clinic-dark',
    cancelled: 'bg-alert/10 text-alert',
    completed: 'bg-ink/10 text-ink/60'
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${colors[status] || ''}`}>
      {status}
    </span>
  );
}
