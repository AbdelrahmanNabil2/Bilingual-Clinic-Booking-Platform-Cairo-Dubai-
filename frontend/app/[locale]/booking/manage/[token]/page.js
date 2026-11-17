'use client';

import { useEffect, useState } from 'react';
import { getMessages } from '@/lib/getMessages';
import { getBookingByToken, rescheduleBooking, cancelBooking, getAvailability } from '@/lib/api';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function ManageBookingPage({ params }) {
  const { locale, token } = params;
  const t = getMessages(locale);

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [rescheduling, setRescheduling] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [slots, setSlots] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [actionError, setActionError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    getBookingByToken(token)
      .then(setBooking)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  async function checkSlots(date) {
    setNewDate(date);
    setSelectedSlot(null);
    if (!date) { setSlots(null); return; }
    setSlotsLoading(true);
    try {
      const result = await getAvailability(booking.location_slug, date);
      setSlots(result);
    } catch (e) {
      setActionError(e.message);
    } finally {
      setSlotsLoading(false);
    }
  }

  async function confirmReschedule() {
    setActionError('');
    try {
      const updated = await rescheduleBooking(token, newDate, selectedSlot);
      setBooking((b) => ({ ...b, ...updated }));
      setActionMessage(t.booking.manageRescheduleSuccess);
      setRescheduling(false);
    } catch (e) {
      setActionError(e.message);
    }
  }

  async function handleCancel() {
    if (!confirm(t.booking.manageCancelConfirm)) return;
    setActionError('');
    try {
      const updated = await cancelBooking(token);
      setBooking((b) => ({ ...b, ...updated }));
      setActionMessage(t.booking.manageCancelSuccess);
    } catch (e) {
      setActionError(e.message);
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-xl px-5 py-24 text-center text-sm text-ink/50">Loading…</div>;
  }

  if (error || !booking) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <p className="text-base text-ink/70">{t.booking.manageNotFound}</p>
      </div>
    );
  }

  const isCancelled = booking.status === 'cancelled';

  return (
    <div className="mx-auto max-w-xl px-5 py-16 md:px-8">
      <h1 className="font-display text-3xl font-semibold text-clinic-dark">{t.booking.manageTitle}</h1>

      <div className="mt-8 rounded-2xl border border-ink/10 bg-white/60 p-6">
        <p className="font-mono text-xs uppercase tracking-wider text-gold">{t.booking.manageCurrentTitle}</p>
        <p className="mt-2 text-lg font-medium text-clinic-dark">
          {String(booking.appointment_date).slice(0, 10)} — {String(booking.appointment_time).slice(0, 5)}
        </p>
        <p className="mt-1 text-sm text-ink/60">{booking.location_city_en}</p>
        <p className="mt-3 text-sm">
          Status: <span className="font-medium capitalize">{booking.status}</span>
        </p>
      </div>

      {actionMessage && <p className="mt-4 text-sm font-medium text-clinic-dark">{actionMessage}</p>}
      {actionError && <p className="mt-4 text-sm font-medium text-alert">{actionError}</p>}

      {isCancelled ? (
        <p className="mt-6 text-sm text-ink/60">{t.booking.manageStatusCancelled}</p>
      ) : (
        <div className="mt-8 flex flex-wrap gap-3">
          {!rescheduling && (
            <button
              type="button"
              onClick={() => setRescheduling(true)}
              className="focus-ring rounded-full border border-clinic/30 px-5 py-2.5 text-sm font-medium text-clinic-dark hover:border-clinic"
            >
              {t.booking.manageReschedule}
            </button>
          )}
          <button
            type="button"
            onClick={handleCancel}
            className="focus-ring rounded-full border border-alert/40 px-5 py-2.5 text-sm font-medium text-alert hover:bg-alert/5"
          >
            {t.booking.manageCancel}
          </button>
        </div>
      )}

      {rescheduling && !isCancelled && (
        <div className="mt-6 rounded-2xl border border-ink/10 bg-white/60 p-6">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink/80">{t.booking.manageNewDate}</span>
            <input
              type="date"
              min={todayStr()}
              value={newDate}
              onChange={(e) => checkSlots(e.target.value)}
              className="focus-ring w-full rounded-lg border border-ink/15 bg-white px-4 py-2.5 text-sm"
            />
          </label>

          {slotsLoading && <p className="mt-4 text-sm text-ink/50">{t.booking.checking}</p>}

          {slots && slots.length === 0 && (
            <p className="mt-4 text-sm text-ink/50">{t.booking.noSlots}</p>
          )}

          {slots && slots.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-ink/80">{t.booking.manageNewTime}</p>
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
            </div>
          )}

          <button
            type="button"
            onClick={confirmReschedule}
            disabled={!selectedSlot}
            className="focus-ring mt-6 rounded-full bg-clinic px-6 py-2.5 text-sm font-medium text-base hover:bg-clinic-dark disabled:opacity-50"
          >
            {t.booking.manageConfirmReschedule}
          </button>
        </div>
      )}
    </div>
  );
}
