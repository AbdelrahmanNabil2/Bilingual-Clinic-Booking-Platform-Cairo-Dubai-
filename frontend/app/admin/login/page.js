'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminLogin, adminVerify2fa, forgotPassword } from '@/lib/adminApi';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pendingToken, setPendingToken] = useState(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await adminLogin(email, password);
      if (result.requires2fa) {
        setPendingToken(result.pendingToken);
      } else {
        router.push('/admin');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await adminVerify2fa(pendingToken, code);
      router.push('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot(e) {
    e.preventDefault();
    setLoading(true);
    const msg = await forgotPassword(email);
    setForgotMessage(msg);
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base px-5">
      <div className="w-full max-w-sm">
        <p className="text-center font-display text-2xl font-semibold text-clinic-dark">Clinic Admin</p>

        {forgotMode ? (
          <form onSubmit={handleForgot} className="mt-8 space-y-5 rounded-2xl border border-ink/10 bg-white/60 p-6">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink/80">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="focus-ring w-full rounded-lg border border-ink/15 bg-white px-4 py-2.5 text-sm"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="focus-ring w-full rounded-full bg-clinic px-6 py-3 text-sm font-medium text-base transition-colors hover:bg-clinic-dark disabled:opacity-60"
            >
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
            {forgotMessage && <p className="text-sm text-ink/70">{forgotMessage}</p>}
            <button
              type="button"
              onClick={() => { setForgotMode(false); setForgotMessage(''); }}
              className="focus-ring block text-sm text-clinic hover:text-clinic-dark"
            >
              ← Back to login
            </button>
          </form>
        ) : pendingToken ? (
          <form onSubmit={handleVerify} className="mt-8 space-y-5 rounded-2xl border border-ink/10 bg-white/60 p-6">
            <p className="text-sm text-ink/70">Enter the 6-digit code from your authenticator app.</p>
            <input
              type="text"
              inputMode="numeric"
              autoFocus
              required
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="focus-ring w-full rounded-lg border border-ink/15 bg-white px-4 py-2.5 text-center text-lg tracking-widest"
            />
            <button
              type="submit"
              disabled={loading}
              className="focus-ring w-full rounded-full bg-clinic px-6 py-3 text-sm font-medium text-base transition-colors hover:bg-clinic-dark disabled:opacity-60"
            >
              {loading ? 'Verifying…' : 'Verify'}
            </button>
            {error && <p role="alert" className="text-sm font-medium text-alert">{error}</p>}
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5 rounded-2xl border border-ink/10 bg-white/60 p-6">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink/80">Email</span>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="focus-ring w-full rounded-lg border border-ink/15 bg-white px-4 py-2.5 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink/80">Password</span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="focus-ring w-full rounded-lg border border-ink/15 bg-white px-4 py-2.5 text-sm"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="focus-ring w-full rounded-full bg-clinic px-6 py-3 text-sm font-medium text-base transition-colors hover:bg-clinic-dark disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Log in'}
            </button>

            {error && <p role="alert" className="text-sm font-medium text-alert">{error}</p>}

            <button
              type="button"
              onClick={() => setForgotMode(true)}
              className="focus-ring block text-sm text-ink/50 hover:text-clinic"
            >
              Forgot your password?
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-ink/40">
          <Link href="/en" className="focus-ring hover:text-clinic">← Back to the site</Link>
        </p>
      </div>
    </div>
  );
}
