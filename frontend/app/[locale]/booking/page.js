'use client';

import { useState } from 'react';
import { getMessages } from '@/lib/getMessages';
import { getAvailability, bookAppointment, joinWaitlist } from '@/lib/api';

const COUNTRY_TO_LOCATION = { egypt: 'cairo', uae: 'dubai' };

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function BookingPage({ params }) {
  const { locale } = params;
  const t = getMessages(locale);

  const [country, setCountry] = useState('egypt');
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState(null); // null = not checked yet, [] = checked, none available
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' });
  const [submitStatus, setSubmitStatus] = useState('idle'); // idle | submitting | success | error
  const [submitError, setSubmitError] = useState('');
  const [confirmed, setConfirmed] = useState(null);
  const [waitlistStatus, setWaitlistStatus] = useState('idle'); // idle | joining | joined

  const location = COUNTRY_TO_LOCATION[country];

  function resetSlots() {
    setSlots(null);
    setSelectedSlot(null);
    setSlotsError('');
  }

  function handleCountryChange(value) {
    setCountry(value);
    resetSlots();
  }

  function handleDateChange(value) {
    setDate(value);
    resetSlots();
  }

  async function checkAvailability() {
    if (!date) return;
    setSlotsLoading(true);
    setSlotsError('');
    setSelectedSlot(null);
    try {
      const result = await getAvailability(location, date);
      setSlots(result);
    } catch (err) {
      setSlotsError(err.message);
      setSlots(null);
    } finally {
      setSlotsLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitStatus('submitting');
    setSubmitError('');
    try {
      const result = await bookAppointment({
        patient_name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        location,
        date,
        time: selectedSlot,
        notes: form.notes || undefined
      });
      setConfirmed(result.data);
      setSubmitStatus('success');
    } catch (err) {
      setSubmitStatus('error');
      if (err.status === 409) {
        setSubmitError(t.booking.slotTakenError);
        setSelectedSlot(null);
        checkAvailability();
      } else {
        setSubmitError(t.booking.formError);
      }
    }
  }

  function startOver() {
    setConfirmed(null);
    setSubmitStatus('idle');
    setForm({ name: '', email: '', phone: '', notes: '' });
    resetSlots();
    setDate('');
    setWaitlistStatus('idle');
  }

  async function handleJoinWaitlist() {
    if (!form.name || !form.email) return;
    setWaitlistStatus('joining');
    try {
      await joinWaitlist({ patient_name: form.name, email: form.email, phone: form.phone || undefined, location, date });
      setWaitlistStatus('joined');
    } catch {
      setWaitlistStatus('idle');
    }
  }

  if (submitStatus === 'success' && confirmed) {
    return (
      <div className="mx-auto max-w-content px-5 py-24 md:px-8">
        <div className="mx-auto max-w-md rounded-2xl border border-clinic/20 bg-sand/60 p-8 text-center">
          <h1 className="font-display text-2xl font-semibold text-clinic-dark">{t.booking.formSuccessTitle}</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink/70">{t.booking.formSuccessBody}</p>
          <div className="mt-6 space-y-1 font-mono text-sm text-ink/70">
            <p>{confirmed.appointment_date?.slice(0, 10)} — {confirmed.appointment_time?.slice(0, 5)}</p>
          </div>
          <button
            type="button"
            onClick={startOver}
            className="focus-ring mt-8 rounded-full bg-clinic px-6 py-3 text-sm font-medium text-base transition-colors hover:bg-clinic-dark"
          >
            {t.booking.bookAnother}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-content px-5 py-16 md:px-8">
      <p className="font-mono text-xs uppercase tracking-widest text-gold">{t.nav.booking}</p>
      <h1 className="mt-3 max-w-2xl font-display text-3xl font-semibold text-clinic-dark md:text-4xl">
        {t.booking.title}
      </h1>
      <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink/70">{t.booking.intro}</p>

      <div className="mt-12 grid gap-10 md:grid-cols-[1fr,1.2fr]">
        <div className="space-y-8">
          {/* Step 1: country/location */}
          <div>
            <p className="mb-3 text-sm font-medium text-ink/80">{t.booking.stepCountry}</p>
            <div className="flex gap-3">
              <CountryButton
                active={country === 'egypt'}
                onClick={() => handleCountryChange('egypt')}
                label={t.booking.countryEgypt}
                city={t.locations.cairo.city}
              />
              <CountryButton
                active={country === 'uae'}
                onClick={() => handleCountryChange('uae')}
                label={t.booking.countryUae}
                city={t.locations.dubai.city}
              />
            </div>
          </div>

          {/* Step 2: date */}
          <div>
            <label className="mb-3 block text-sm font-medium text-ink/80" htmlFor="booking-date">
              {t.booking.stepDate}
            </label>
            <input
              id="booking-date"
              type="date"
              min={todayStr()}
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
              className="focus-ring w-full rounded-lg border border-ink/15 bg-white px-4 py-2.5 text-sm"
            />
            <button
              type="button"
              onClick={checkAvailability}
              disabled={!date || slotsLoading}
              className="focus-ring mt-3 rounded-full border border-clinic/30 px-5 py-2 text-sm font-medium text-clinic-dark transition-colors hover:border-clinic disabled:opacity-50"
            >
              {slotsLoading ? t.booking.checking : t.booking.checkAvailability}
            </button>
          </div>

          {/* Step 3: slots */}
          <div>
            <p className="mb-3 text-sm font-medium text-ink/80">{t.booking.stepSlot}</p>
            {slotsError && <p className="text-sm text-alert">{slotsError}</p>}
            {!slotsError && slots === null && (
              <p className="text-sm text-ink/50">{t.booking.selectSlotFirst}</p>
            )}
            {!slotsError && slots !== null && slots.length === 0 && (
              <div>
                <p className="text-sm text-ink/50">{t.booking.noSlots}</p>
                <div className="mt-4 rounded-xl border border-ink/10 bg-white/60 p-4">
                  <p className="text-sm font-medium text-ink/80">{t.booking.joinWaitlistPrompt}</p>
                  {waitlistStatus === 'joined' ? (
                    <p className="mt-2 text-sm text-clinic-dark">{t.booking.waitlistSuccess}</p>
                  ) : (
                    <>
                      <p className="mt-1 text-xs text-ink/50">
                        {form.name && form.email ? '' : 'Fill in your name and email below first.'}
                      </p>
                      <button
                        type="button"
                        onClick={handleJoinWaitlist}
                        disabled={!form.name || !form.email || waitlistStatus === 'joining'}
                        className="focus-ring mt-2 rounded-full border border-clinic/30 px-4 py-1.5 text-sm font-medium text-clinic-dark hover:border-clinic disabled:opacity-50"
                      >
                        {t.booking.joinWaitlist}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
            {!slotsError && slots !== null && slots.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`focus-ring rounded-full border px-4 py-1.5 font-mono text-sm transition-colors ${
                      selectedSlot === slot
                        ? 'border-clinic bg-clinic text-base'
                        : 'border-ink/15 bg-white text-ink/70 hover:border-clinic'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Step 4: details form */}
        <div>
          <p className="mb-3 text-sm font-medium text-ink/80">{t.booking.stepDetails}</p>
          <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-ink/10 bg-white/60 p-6">
            <Field label={t.booking.formName} required>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="focus-ring w-full rounded-lg border border-ink/15 bg-white px-4 py-2.5 text-sm"
              />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={t.booking.formEmail} required>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="focus-ring w-full rounded-lg border border-ink/15 bg-white px-4 py-2.5 text-sm"
                />
              </Field>
              <Field label={t.booking.formPhone}>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="focus-ring w-full rounded-lg border border-ink/15 bg-white px-4 py-2.5 text-sm"
                />
              </Field>
            </div>
            <Field label={t.booking.formNotes}>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="focus-ring w-full rounded-lg border border-ink/15 bg-white px-4 py-2.5 text-sm"
              />
            </Field>

            <button
              type="submit"
              disabled={!selectedSlot || submitStatus === 'submitting'}
              className="focus-ring w-full rounded-full bg-clinic px-6 py-3 text-sm font-medium text-base transition-colors hover:bg-clinic-dark disabled:opacity-50"
            >
              {submitStatus === 'submitting' ? t.booking.formSubmitting : t.booking.formSubmit}
            </button>

            {submitStatus === 'error' && (
              <p role="alert" className="text-sm font-medium text-alert">{submitError}</p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

function CountryButton({ active, onClick, label, city }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`focus-ring flex-1 rounded-xl border px-4 py-3 text-start transition-colors ${
        active ? 'border-clinic bg-clinic text-base' : 'border-ink/15 bg-white text-ink/70 hover:border-clinic'
      }`}
    >
      <span className="block text-sm font-medium">{label}</span>
      <span className={`block text-xs ${active ? 'text-base/70' : 'text-ink/40'}`}>{city}</span>
    </button>
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
