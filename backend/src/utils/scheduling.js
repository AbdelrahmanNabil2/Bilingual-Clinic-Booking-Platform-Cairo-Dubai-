const { DateTime } = require('luxon');
const pool = require('../db/pool');

function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(mins) {
  const h = Math.floor(mins / 60).toString().padStart(2, '0');
  const m = (mins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Returns an array of "HH:MM" slots available for booking at the given
 * location (and optionally a specific doctor) on the given date, in the
 * location's own timezone. Derived from clinic_hours, minus any ad-hoc
 * closure for that date, minus whatever's already booked for that
 * location+doctor combination.
 *
 * @param {number} locationId
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @param {number|null} doctorId - if provided, checks that doctor's own
 *   bookings only, so multiple doctors at one location can have independent
 *   availability. If null, treats the location itself as the bookable unit.
 */
async function getAvailableSlots(locationId, dateStr, doctorId = null) {
  const { rows: locRows } = await pool.query('SELECT timezone FROM locations WHERE id = $1', [locationId]);
  const timezone = locRows[0]?.timezone || 'UTC';

  const date = DateTime.fromISO(dateStr, { zone: timezone });
  if (!date.isValid) {
    const err = new Error('Invalid date.');
    err.status = 400;
    throw err;
  }

  // Closed for a specific date (holiday, one-off closure) regardless of the
  // normal weekly schedule.
  const { rows: closureRows } = await pool.query(
    'SELECT 1 FROM clinic_closures WHERE location_id = $1 AND closure_date = $2',
    [locationId, dateStr]
  );
  if (closureRows.length) return [];

  // Luxon weekday: 1 = Monday ... 7 = Sunday. Our schema uses JS convention:
  // 0 = Sunday ... 6 = Saturday.
  const dayOfWeek = date.weekday % 7;

  const { rows: hoursRows } = await pool.query(
    `SELECT is_closed, open_time, close_time, slot_duration_minutes
     FROM clinic_hours WHERE location_id = $1 AND day_of_week = $2`,
    [locationId, dayOfWeek]
  );
  const hours = hoursRows[0];
  if (!hours || hours.is_closed || !hours.open_time || !hours.close_time) {
    return [];
  }

  const openMin = timeToMinutes(hours.open_time.slice(0, 5));
  const closeMin = timeToMinutes(hours.close_time.slice(0, 5));
  const step = hours.slot_duration_minutes;

  const allSlots = [];
  for (let m = openMin; m + step <= closeMin; m += step) {
    allSlots.push(minutesToTime(m));
  }

  const { rows: booked } = await pool.query(
    `SELECT appointment_time FROM appointments
     WHERE location_id = $1 AND appointment_date = $2 AND status <> 'cancelled'
       AND COALESCE(doctor_id, -1) = COALESCE($3, -1)`,
    [locationId, dateStr, doctorId]
  );
  const bookedSet = new Set(booked.map((r) => r.appointment_time.slice(0, 5)));

  let available = allSlots.filter((s) => !bookedSet.has(s));

  // Drop slots already in the past, evaluated in the location's own timezone.
  const nowInZone = DateTime.now().setZone(timezone);
  if (date.hasSame(nowInZone, 'day')) {
    const nowMin = nowInZone.hour * 60 + nowInZone.minute;
    available = available.filter((s) => timeToMinutes(s) > nowMin);
  }

  return available;
}

module.exports = { getAvailableSlots };
