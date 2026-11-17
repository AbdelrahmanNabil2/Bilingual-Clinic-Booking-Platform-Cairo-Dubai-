const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// The access token lives in memory only (not localStorage) — it's short-lived
// (15 minutes) by design. The refresh token that renews it lives in an
// httpOnly cookie the browser sends automatically; JS never touches it.
let accessToken = null;
let currentAdmin = null;

export function getCurrentAdmin() {
  return currentAdmin;
}

async function rawFetch(path, options = {}) {
  return fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options.headers || {})
    }
  });
}

async function tryRefresh() {
  const res = await fetch(`${API_URL}/auth/refresh`, { method: 'POST', credentials: 'include' });
  if (!res.ok) return false;
  const data = await res.json();
  accessToken = data.accessToken;
  currentAdmin = data.admin;
  return true;
}

/** Restores a session on page load using the httpOnly refresh cookie, if one exists. */
export async function restoreSession() {
  if (accessToken) return currentAdmin;
  const ok = await tryRefresh();
  return ok ? currentAdmin : null;
}

async function adminFetch(path, options = {}) {
  let res = await rawFetch(path, options);

  if (res.status === 401) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      res = await rawFetch(path, options);
    } else {
      accessToken = null;
      currentAdmin = null;
      if (typeof window !== 'undefined' && !window.location.pathname.endsWith('/admin/login')) {
        window.location.href = '/admin/login';
      }
      throw new Error('Session expired. Please log in again.');
    }
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed.');
  return data;
}

// ── Auth ────────────────────────────────────────────────────────────────

export async function adminLogin(email, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Login failed.');

  if (data.requires2fa) return { requires2fa: true, pendingToken: data.pendingToken };

  accessToken = data.accessToken;
  currentAdmin = data.admin;
  return { requires2fa: false, admin: data.admin };
}

export async function adminVerify2fa(pendingToken, code) {
  const res = await fetch(`${API_URL}/auth/2fa/verify`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pendingToken, code })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Invalid code.');

  accessToken = data.accessToken;
  currentAdmin = data.admin;
  return data.admin;
}

export async function adminLogout() {
  await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
  accessToken = null;
  currentAdmin = null;
}

export async function forgotPassword(email) {
  const data = await (await fetch(`${API_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  })).json();
  return data.message;
}

export async function resetPassword(token, password) {
  const res = await fetch(`${API_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Reset failed.');
  return data.message;
}

export async function setup2fa() {
  const data = await adminFetch('/auth/2fa/setup', { method: 'POST' });
  return data.data;
}

export async function enable2fa(code) {
  return (await adminFetch('/auth/2fa/enable', { method: 'POST', body: JSON.stringify({ code }) })).message;
}

export async function disable2fa(code) {
  return (await adminFetch('/auth/2fa/disable', { method: 'POST', body: JSON.stringify({ code }) })).message;
}

// ── Generic content resources ─────────────────────────────────────────────

export async function listResource(resource) {
  return (await adminFetch(`/admin/${resource}`)).data;
}
export async function getResource(resource, id) {
  return (await adminFetch(`/admin/${resource}/${id}`)).data;
}
export async function createResource(resource, payload) {
  return (await adminFetch(`/admin/${resource}`, { method: 'POST', body: JSON.stringify(payload) })).data;
}
export async function updateResource(resource, id, payload) {
  return (await adminFetch(`/admin/${resource}/${id}`, { method: 'PUT', body: JSON.stringify(payload) })).data;
}
export async function deleteResource(resource, id) {
  await adminFetch(`/admin/${resource}/${id}`, { method: 'DELETE' });
}

// ── Appointments ───────────────────────────────────────────────────────

export async function listAppointments(filters = {}) {
  const qs = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([, v]) => v))).toString();
  return (await adminFetch(`/admin/appointments${qs ? `?${qs}` : ''}`)).data;
}
export async function updateAppointmentStatus(id, status) {
  return (await adminFetch(`/admin/appointments/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) })).data;
}

// ── Waitlist / newsletter (read-only admin views) ─────────────────────────

export async function listWaitlist() {
  return (await adminFetch('/admin/waitlist')).data;
}
export async function listNewsletterSubscribers() {
  return (await adminFetch('/admin/newsletter')).data;
}

// ── Admin user management ─────────────────────────────────────────────────

export async function listAdmins() {
  return (await adminFetch('/admin/admins')).data;
}
export async function createAdmin(payload) {
  return (await adminFetch('/admin/admins', { method: 'POST', body: JSON.stringify(payload) })).data;
}
export async function updateAdminRole(id, role) {
  return (await adminFetch(`/admin/admins/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) })).data;
}
export async function deleteAdmin(id) {
  await adminFetch(`/admin/admins/${id}`, { method: 'DELETE' });
}

// ── File upload ────────────────────────────────────────────────────────

export async function uploadFile(file) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_URL}/upload`, {
    method: 'POST',
    credentials: 'include',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    body: form
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Upload failed.');
  return data.data.url;
}
