'use client';

import { useState } from 'react';
import { submitReview } from '@/lib/api';

const initialForm = { patient_name: '', quote_en: '', quote_ar: '', rating: 5 };

export default function ReviewForm({ messages }) {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('submitting');
    setError('');
    try {
      await submitReview(form);
      setStatus('success');
      setForm(initialForm);
    } catch (err) {
      setStatus('error');
      setError(err.message);
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-2xl border border-clinic/20 bg-sand/60 p-6 text-center">
        <p className="text-sm font-medium text-clinic-dark">{messages.reviews.formSuccess}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-ink/10 bg-white/60 p-6">
      <h2 className="font-display text-lg font-semibold text-clinic-dark">{messages.reviews.title}</h2>
      <p className="text-sm text-ink/60">{messages.reviews.intro}</p>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink/80">{messages.reviews.formName}</span>
        <input
          type="text"
          required
          value={form.patient_name}
          onChange={(e) => setForm((f) => ({ ...f, patient_name: e.target.value }))}
          className="focus-ring w-full rounded-lg border border-ink/15 bg-white px-4 py-2.5 text-sm"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink/80">{messages.reviews.formQuote} (English)</span>
        <textarea
          required
          rows={3}
          value={form.quote_en}
          onChange={(e) => setForm((f) => ({ ...f, quote_en: e.target.value }))}
          className="focus-ring w-full rounded-lg border border-ink/15 bg-white px-4 py-2.5 text-sm"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink/80">{messages.reviews.formQuote} (العربية)</span>
        <textarea
          required
          rows={3}
          dir="rtl"
          value={form.quote_ar}
          onChange={(e) => setForm((f) => ({ ...f, quote_ar: e.target.value }))}
          className="focus-ring w-full rounded-lg border border-ink/15 bg-white px-4 py-2.5 text-sm"
        />
      </label>

      <label className="block max-w-[10rem]">
        <span className="mb-1.5 block text-sm font-medium text-ink/80">{messages.reviews.formRating}</span>
        <select
          value={form.rating}
          onChange={(e) => setForm((f) => ({ ...f, rating: Number(e.target.value) }))}
          className="focus-ring w-full rounded-lg border border-ink/15 bg-white px-4 py-2.5 text-sm"
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>{'★'.repeat(n)}</option>
          ))}
        </select>
      </label>

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="focus-ring rounded-full bg-clinic px-6 py-3 text-sm font-medium text-base transition-colors hover:bg-clinic-dark disabled:opacity-60"
      >
        {messages.reviews.formSubmit}
      </button>

      {status === 'error' && <p role="alert" className="text-sm font-medium text-alert">{error || messages.reviews.formError}</p>}
    </form>
  );
}
