'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { resetPassword } from '@/lib/adminApi';

export default function ResetPasswordPage({ params }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await resetPassword(params.token, password);
      setDone(true);
      setTimeout(() => router.push('/admin/login'), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base px-5">
      <div className="w-full max-w-sm">
        <p className="text-center font-display text-2xl font-semibold text-clinic-dark">Reset Password</p>

        {done ? (
          <p className="mt-8 rounded-2xl border border-clinic/20 bg-sand/60 p-6 text-center text-sm text-ink/70">
            Password updated — redirecting you to log in…
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5 rounded-2xl border border-ink/10 bg-white/60 p-6">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink/80">New password (8+ characters)</span>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="focus-ring w-full rounded-lg border border-ink/15 bg-white px-4 py-2.5 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink/80">Confirm new password</span>
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="focus-ring w-full rounded-lg border border-ink/15 bg-white px-4 py-2.5 text-sm"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="focus-ring w-full rounded-full bg-clinic px-6 py-3 text-sm font-medium text-base transition-colors hover:bg-clinic-dark disabled:opacity-60"
            >
              {loading ? 'Saving…' : 'Reset password'}
            </button>
            {error && <p role="alert" className="text-sm font-medium text-alert">{error}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
