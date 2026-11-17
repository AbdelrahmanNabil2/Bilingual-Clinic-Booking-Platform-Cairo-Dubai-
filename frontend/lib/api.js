const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function submitContactForm(payload) {
  const res = await fetch(`${API_URL}/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Request failed');
  }

  return res.json();
}

/**
 * All GET helpers below are "fail safe": if the backend is unreachable or
 * returns no rows, they resolve to null so pages can fall back to the
 * static copy in messages/*.json instead of breaking the page. Requests
 * use `cache: 'no-store'` so content reflects the database immediately —
 * these pages render dynamically rather than being statically built.
 */
async function safeFetch(path) {
  try {
    const res = await fetch(`${API_URL}${path}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    return null; // backend unreachable — caller falls back to static content
  }
}

export async function getServices(locale) {
  const rows = await safeFetch('/services');
  if (!rows || rows.length === 0) return null;

  return rows.map((row) => ({
    title: locale === 'ar' ? row.title_ar : row.title_en,
    body: locale === 'ar' ? row.description_ar : row.description_en
  }));
}

export async function getDoctors(locale) {
  const rows = await safeFetch('/doctors');
  if (!rows || rows.length === 0) return null;

  return rows.map((row) => ({
    slug: row.slug,
    name: locale === 'ar' ? row.name_ar : row.name_en,
    title: locale === 'ar' ? row.title_ar : row.title_en,
    bio: locale === 'ar' ? row.bio_ar : row.bio_en,
    photoUrl: row.photo_url,
    location: locale === 'ar' ? row.location_city_ar : row.location_city_en
  }));
}

export async function getDoctor(locale, slug) {
  const row = await safeFetch(`/doctors/${encodeURIComponent(slug)}`);
  if (!row) return null;

  return {
    slug: row.slug,
    name: locale === 'ar' ? row.name_ar : row.name_en,
    title: locale === 'ar' ? row.title_ar : row.title_en,
    bio: locale === 'ar' ? row.bio_ar : row.bio_en,
    photoUrl: row.photo_url,
    location: locale === 'ar' ? row.location_city_ar : row.location_city_en
  };
}

export async function getLocations(locale) {
  const rows = await safeFetch('/locations');
  if (!rows || rows.length === 0) return null;

  const bySlug = {};
  for (const row of rows) {
    bySlug[row.slug] = {
      city: locale === 'ar' ? row.city_ar : row.city_en,
      country: locale === 'ar' ? row.country_ar : row.country_en,
      addressLine1: locale === 'ar' ? row.address_ar : row.address_en,
      addressLine2: '',
      phone: row.phone,
      email: row.email,
      hours: locale === 'ar' ? row.hours_ar : row.hours_en,
      latitude: row.latitude,
      longitude: row.longitude
    };
  }
  return bySlug;
}

export async function getTestimonials(locale) {
  const rows = await safeFetch('/testimonials');
  if (!rows || rows.length === 0) return null;

  return rows.map((row) => ({
    quote: locale === 'ar' ? row.quote_ar : row.quote_en,
    name: row.patient_name
  }));
}

export async function getNewsList(locale) {
  const rows = await safeFetch('/news');
  if (!rows) return [];

  return rows.map((row) => ({
    slug: row.slug,
    title: locale === 'ar' ? row.title_ar : row.title_en,
    excerpt: (locale === 'ar' ? row.excerpt_ar : row.excerpt_en) || '',
    coverImageUrl: row.cover_image_url,
    publishedAt: row.published_at
  }));
}

export async function getNewsArticle(locale, slug) {
  const rows = await safeFetch(`/news/${encodeURIComponent(slug)}`);
  // safeFetch expects `{ data: [...] }`, but the detail endpoint returns
  // `{ data: {...} }` — handle both shapes by checking for an array first.
  const row = Array.isArray(rows) ? rows[0] : rows;
  if (!row) return null;

  return {
    slug: row.slug,
    title: locale === 'ar' ? row.title_ar : row.title_en,
    body: locale === 'ar' ? row.body_ar : row.body_en,
    coverImageUrl: row.cover_image_url,
    publishedAt: row.published_at
  };
}

export async function getAvailability(location, date) {
  const res = await fetch(
    `${API_URL}/appointments/availability?location=${encodeURIComponent(location)}&date=${encodeURIComponent(date)}`,
    { cache: 'no-store' }
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Could not load availability.');
  }
  const json = await res.json();
  return json.data.slots;
}

export async function bookAppointment(payload) {
  const res = await fetch(`${API_URL}/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || 'Booking failed.');
    err.status = res.status;
    throw err;
  }
  return data;
}

export async function siteSearch(query) {
  const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`, { cache: 'no-store' });
  if (!res.ok) return { news: [], services: [] };
  const json = await res.json();
  return json.data;
}

export async function subscribeNewsletter(email, locale) {
  const res = await fetch(`${API_URL}/newsletter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, locale })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Subscription failed.');
  return data;
}

export async function submitReview(payload) {
  const res = await fetch(`${API_URL}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Submission failed.');
  return data;
}

export async function joinWaitlist(payload) {
  const res = await fetch(`${API_URL}/waitlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed.');
  return data;
}

export async function getBookingByToken(token) {
  const res = await fetch(`${API_URL}/appointments/manage/${encodeURIComponent(token)}`, { cache: 'no-store' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Booking not found.');
  return data.data;
}

export async function rescheduleBooking(token, date, time) {
  const res = await fetch(`${API_URL}/appointments/manage/${encodeURIComponent(token)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date, time })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || 'Reschedule failed.');
    err.status = res.status;
    throw err;
  }
  return data.data;
}

export async function cancelBooking(token) {
  const res = await fetch(`${API_URL}/appointments/manage/${encodeURIComponent(token)}/cancel`, {
    method: 'PUT'
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Cancellation failed.');
  return data.data;
}
