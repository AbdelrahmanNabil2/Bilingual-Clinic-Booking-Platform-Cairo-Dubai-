'use client';

import { useEffect, useState } from 'react';
import {
  getCurrentAdmin, setup2fa, enable2fa, disable2fa,
  listAdmins, createAdmin, updateAdminRole, deleteAdmin
} from '@/lib/adminApi';

export default function AdminSettingsPage() {
  const me = getCurrentAdmin();

  return (
    <div className="max-w-2xl space-y-12">
      <h1 className="font-display text-2xl font-semibold text-clinic-dark">Settings</h1>
      <TwoFactorSection />
      {me?.role === 'admin' && <AdminUsersSection />}
    </div>
  );
}

function TwoFactorSection() {
  const [setupData, setSetupData] = useState(null);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSetup() {
    setError('');
    try {
      setSetupData(await setup2fa());
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleEnable(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      setMessage(await enable2fa(code));
      setSetupData(null);
      setCode('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDisable(e) {
    e.preventDefault();
    const disableCode = prompt('Enter your current 6-digit code to disable two-factor authentication:');
    if (!disableCode) return;
    setLoading(true);
    setError('');
    try {
      setMessage(await disable2fa(disableCode));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h2 className="font-display text-lg font-semibold text-clinic-dark">Two-factor authentication</h2>
      <p className="mt-1 text-sm text-ink/60">Add an authenticator app code as a second login step.</p>

      {!setupData && (
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={handleSetup}
            className="focus-ring rounded-full bg-clinic px-5 py-2 text-sm font-medium text-base hover:bg-clinic-dark"
          >
            Set up 2FA
          </button>
          <button
            type="button"
            onClick={handleDisable}
            className="focus-ring rounded-full border border-ink/15 px-5 py-2 text-sm font-medium text-ink/70 hover:border-alert hover:text-alert"
          >
            Disable 2FA
          </button>
        </div>
      )}

      {setupData && (
        <form onSubmit={handleEnable} className="mt-4 space-y-4 rounded-2xl border border-ink/10 bg-white/60 p-6">
          <p className="text-sm text-ink/70">Scan this QR code with an authenticator app (Google Authenticator, Authy, etc.):</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={setupData.qrCodeDataUrl} alt="2FA QR code" className="h-40 w-40" />
          <p className="font-mono text-xs text-ink/50">Manual entry key: {setupData.secret}</p>
          <input
            type="text"
            inputMode="numeric"
            placeholder="6-digit code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="focus-ring w-full rounded-lg border border-ink/15 bg-white px-4 py-2.5 text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="focus-ring rounded-full bg-clinic px-5 py-2 text-sm font-medium text-base hover:bg-clinic-dark disabled:opacity-60"
          >
            {loading ? 'Confirming…' : 'Confirm and enable'}
          </button>
        </form>
      )}

      {message && <p className="mt-3 text-sm text-clinic-dark">{message}</p>}
      {error && <p className="mt-3 text-sm text-alert">{error}</p>}
    </section>
  );
}

function AdminUsersSection() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'manager' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    load();
  }, []);

  function load() {
    setLoading(true);
    listAdmins()
      .then(setAdmins)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      await createAdmin(form);
      setForm({ name: '', email: '', password: '', role: 'manager' });
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleRoleChange(id, role) {
    try {
      await updateAdminRole(id, role);
      load();
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Remove this admin account?')) return;
    try {
      await deleteAdmin(id);
      load();
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <section>
      <h2 className="font-display text-lg font-semibold text-clinic-dark">Admin users</h2>
      <p className="mt-1 text-sm text-ink/60">
        Staff can create/edit content. Managers can also delete. Admins can also manage other admin accounts.
      </p>

      {loading ? (
        <p className="mt-4 text-sm text-ink/50">Loading…</p>
      ) : (
        <div className="mt-4 space-y-2">
          {admins.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-lg border border-ink/10 bg-white/60 px-4 py-2.5">
              <div>
                <p className="text-sm font-medium text-ink">{a.name}</p>
                <p className="text-xs text-ink/50">{a.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={a.role}
                  onChange={(e) => handleRoleChange(a.id, e.target.value)}
                  className="focus-ring rounded-lg border border-ink/15 bg-white px-2 py-1 text-xs"
                >
                  <option value="staff">staff</option>
                  <option value="manager">manager</option>
                  <option value="admin">admin</option>
                </select>
                <button
                  type="button"
                  onClick={() => handleDelete(a.id)}
                  className="focus-ring text-xs font-medium text-alert hover:opacity-80"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleCreate} className="mt-6 grid gap-3 rounded-2xl border border-ink/10 bg-white/60 p-6 sm:grid-cols-2">
        <input
          type="text" required placeholder="Name" value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="focus-ring rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm"
        />
        <input
          type="email" required placeholder="Email" value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          className="focus-ring rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm"
        />
        <input
          type="password" required placeholder="Temporary password (8+ chars)" value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          className="focus-ring rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm"
        />
        <select
          value={form.role}
          onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
          className="focus-ring rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm"
        >
          <option value="staff">staff</option>
          <option value="manager">manager</option>
          <option value="admin">admin</option>
        </select>
        <button
          type="submit"
          disabled={creating}
          className="focus-ring rounded-full bg-clinic px-5 py-2 text-sm font-medium text-base hover:bg-clinic-dark disabled:opacity-60 sm:col-span-2"
        >
          {creating ? 'Creating…' : '+ Add admin user'}
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-alert">{error}</p>}
    </section>
  );
}
