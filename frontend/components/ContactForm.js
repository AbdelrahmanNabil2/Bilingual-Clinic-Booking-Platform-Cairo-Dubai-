'use client';

import { useState } from 'react';
import { submitContactForm } from '@/lib/api';

const initialForm = { name: '', email: '', phone: '', location: 'either', message: '' };

export default function ContactForm({ messages }) {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('submitting');
    try {
      await submitContactForm(form);
      setStatus('success');
      setForm(initialForm);
    } catch (err) {
      setStatus('error');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field label={messages.contact.formName} required>
        <input
          type="text"
          required
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          className="focus-ring w-full rounded-lg border border-ink/15 bg-white px-4 py-2.5 text-sm"
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={messages.contact.formEmail} required>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            className="focus-ring w-full rounded-lg border border-ink/15 bg-white px-4 py-2.5 text-sm"
          />
        </Field>

        <Field label={messages.contact.formPhone}>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            className="focus-ring w-full rounded-lg border border-ink/15 bg-white px-4 py-2.5 text-sm"
          />
        </Field>
      </div>

      <Field label={messages.contact.formLocation}>
        <select
          value={form.location}
          onChange={(e) => update('location', e.target.value)}
          className="focus-ring w-full rounded-lg border border-ink/15 bg-white px-4 py-2.5 text-sm"
        >
          <option value="either">{messages.contact.formLocationEither}</option>
          <option value="cairo">{messages.contact.formLocationCairo}</option>
          <option value="dubai">{messages.contact.formLocationDubai}</option>
        </select>
      </Field>

      <Field label={messages.contact.formMessage} required>
        <textarea
          required
          rows={5}
          value={form.message}
          onChange={(e) => update('message', e.target.value)}
          className="focus-ring w-full rounded-lg border border-ink/15 bg-white px-4 py-2.5 text-sm"
        />
      </Field>

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="focus-ring rounded-full bg-clinic px-6 py-3 text-sm font-medium text-base transition-colors hover:bg-clinic-dark disabled:opacity-60"
      >
        {status === 'submitting' ? messages.contact.formSubmitting : messages.contact.formSubmit}
      </button>

      {status === 'success' && (
        <p role="status" className="text-sm font-medium text-clinic-dark">{messages.contact.formSuccess}</p>
      )}
      {status === 'error' && (
        <p role="alert" className="text-sm font-medium text-alert">{messages.contact.formError}</p>
      )}
    </form>
  );
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink/80">
        {label}
        {required && <span className="text-alert"> *</span>}
      </span>
      {children}
    </label>
  );
}
