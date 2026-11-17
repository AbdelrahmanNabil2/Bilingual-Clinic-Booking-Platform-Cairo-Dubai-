'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { listAppointments, listResource } from '@/lib/adminApi';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    Promise.all([
      listAppointments({ date: today }),
      listAppointments({ status: 'confirmed' }),
      listResource('news')
    ])
      .then(([todayAppts, confirmedAppts, news]) => {
        setStats({
          today: todayAppts.length,
          upcoming: confirmedAppts.length,
          news: news.length
        });
      })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-semibold text-clinic-dark">Dashboard</h1>
      {error && <p className="text-sm text-alert">{error}</p>}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Appointments today" value={stats.today} href="/admin/appointments" />
          <StatCard label="Confirmed appointments" value={stats.upcoming} href="/admin/appointments" />
          <StatCard label="News articles" value={stats.news} href="/admin/news" />
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, href }) {
  return (
    <Link
      href={href}
      className="focus-ring block rounded-2xl border border-ink/10 bg-white/60 p-6 transition-shadow hover:shadow-md"
    >
      <p className="font-display text-3xl font-semibold text-clinic-dark">{value}</p>
      <p className="mt-1 text-sm text-ink/60">{label}</p>
    </Link>
  );
}
