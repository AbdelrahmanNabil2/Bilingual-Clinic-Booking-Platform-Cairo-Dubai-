'use client';

import { useState } from 'react';
import { subscribeNewsletter } from '@/lib/api';

export default function NewsletterForm({ locale, messages }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('submitting');
    try {
      await subscribeNewsletter(email, locale);
      setStatus('success');
      setEmail('');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-wider text-ink/50">{messages.newsletter.title}</p>
      <p className="mt-2 max-w-xs text-sm text-ink/70">{messages.newsletter.body}</p>
      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          type="email"
          required
          placeholder={messages.newsletter.placeholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="focus-ring w-full min-w-0 rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="focus-ring shrink-0 rounded-lg bg-clinic px-4 py-2 text-sm font-medium text-base hover:bg-clinic-dark disabled:opacity-60"
        >
          {messages.newsletter.submit}
        </button>
      </form>
      {status === 'success' && <p className="mt-2 text-xs font-medium text-clinic-dark">{messages.newsletter.success}</p>}
      {status === 'error' && <p className="mt-2 text-xs font-medium text-alert">{messages.newsletter.error}</p>}
    </div>
  );
}
