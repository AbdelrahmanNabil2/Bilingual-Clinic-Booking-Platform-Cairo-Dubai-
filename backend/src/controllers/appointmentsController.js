const pool = require('../db/pool');
const { getAvailableSlots } = require('../utils/scheduling');
const { generateToken } = require('../utils/randomToken');
const {
  sendBookingConfirmation, sendBookingNotification,
  sendRescheduleConfirmation, sendCancellationConfirmation
} = require('../utils/mailer');
const { sendSms, sendWhatsApp } = require('../utils/sms');
const { createDepositCheckoutSession } = require('../utils/payments');
const { notifyNextWaitlistEntry } = require('./waitlistController');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function getLocationBySlug(slug) {
  const { rows } = await pool.query('SELECT * FROM locations WHERE slug = $1', [slug]);
  return rows[0] || null;
}

async function getDoctorById(id) {
  if (!id) return null;
  const { rows } = await pool.query('SELECT * FROM doctors WHERE id = $1', [id]);
  return rows[0] || null;
}

async function getServiceById(id) {
  if (!id) return null;
  const { rows } = await pool.query('SELECT * FROM services WHERE id = $1', [id]);
  return rows[0] || null;
}

function withLocationDetails(appointment, loc) {
  return { ...appointment, locationCityEn: loc.city_en, locationCityAr: loc.city_ar };
}

// ── Public: availability ─────────────────────────────────────────────────

async function availability(req, res, next) {
  try {
    const { location, date, doctor } = req.query;
    if (!location || !date) {
      return res.status(400).json({ message: 'location and date query parameters are required.' });
    }
    const loc = await getLocationBySlug(location);
    if (!loc) return res.status(404).json({ message: 'Unknown location.' });

    const slots = await getAvailableSlots(loc.id, date, doctor ? Number(doctor) : null);
    res.json({ data: { location: loc.slug, date, doctor: doctor ? Number(doctor) : null, slots } });
  } catch (err) {
    next(err);
  }
}

// ── Public: create booking ────────────────────────────────────────────────

async function createAppointment(req, res, next) {
  try {
    const { patient_name, email, phone, location, date, time, service_id, doctor_id, notes } = req.body || {};

    const errors = [];
    if (!patient_name || patient_name.trim().length < 2) errors.push('A valid name is required.');
    if (!email || !EMAIL_RE.test(email)) errors.push('A valid email is required.');
    if (!location) errors.push('A location is required.');
    if (!date) errors.push('A date is required.');
    if (!time) errors.push('A time is required.');
    if (errors.length) return res.status(400).json({ message: errors.join(' ') });

    const loc = await getLocationBySlug(location);
    if (!loc) return res.status(400).json({ message: 'Unknown location.' });

    const doctor = await getDoctorById(doctor_id);
    const service = await getServiceById(service_id);

    // Re-check availability immediately before booking to close the race
    // window between the patient loading slots and submitting the form.
    const slots = await getAvailableSlots(loc.id, date, doctor?.id || null);
    if (!slots.includes(time)) {
      return res.status(409).json({ message: 'That time slot is no longer available. Please choose another.' });
    }

    const manageToken = generateToken();
    const requiresDeposit = !!(service && service.deposit_cents);
    const depositStatus = requiresDeposit ? 'pending' : 'not_required';

    let appointment;
    try {
      const { rows } = await pool.query(
        `INSERT INTO appointments
          (patient_name, email, phone, location_id, service_id, doctor_id, appointment_date,
           appointment_time, notes, status, manage_token, deposit_status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'confirmed',$10,$11)
         RETURNING *`,
        [patient_name.trim(), email.trim(), phone || null, loc.id, service?.id || null, doctor?.id || null,
         date, time, notes || null, manageToken, depositStatus]
      );
      appointment = rows[0];
    } catch (err) {
      // Unique constraint on (location, doctor, date, time) — someone else
      // booked this exact slot in the moment between our check and this insert.
      if (err.code === '23505') {
        return res.status(409).json({ message: 'That time slot was just booked by someone else. Please choose another.' });
      }
      throw err;
    }

    const details = withLocationDetails(appointment, loc);

    // Email/SMS/WhatsApp delivery is best-effort and must never fail the booking.
    sendBookingConfirmation(details).catch((e) => console.error('Booking confirmation email failed:', e.message));
    sendBookingNotification(details).catch((e) => console.error('Booking notification email failed:', e.message));
    if (appointment.phone) {
      const smsBody = `Appointment confirmed: ${appointment.appointment_date} at ${appointment.appointment_time.slice(0, 5)} — ${loc.city_en} clinic.`;
      sendSms(appointment.phone, smsBody).catch((e) => console.error('SMS failed:', e.message));
      sendWhatsApp(appointment.phone, smsBody).catch((e) => console.error('WhatsApp failed:', e.message));
    }

    // Deposit collection (only kicks in if the service has a deposit AND
    // Stripe is actually configured — otherwise we don't block the booking
    // on a missing API key, we just skip payment collection).
    let checkoutUrl = null;
    if (requiresDeposit) {
      try {
        const origin = (process.env.FRONTEND_ORIGIN || 'http://localhost:3000').split(',')[0];
        const session = await createDepositCheckoutSession({
          appointment,
          depositCents: service.deposit_cents,
          description: `Deposit — ${service.title_en}`,
          successUrl: `${origin}/en/booking/manage/${manageToken}?paid=1`,
          cancelUrl: `${origin}/en/booking/manage/${manageToken}?paid=0`
        });
        if (session) {
          checkoutUrl = session.url;
          await pool.query('UPDATE appointments SET stripe_session_id = $1 WHERE id = $2', [session.id, appointment.id]);
        } else {
          // Stripe not configured — don't block the booking, just don't collect a deposit.
          appointment.deposit_status = 'not_required';
          await pool.query("UPDATE appointments SET deposit_status = 'not_required' WHERE id = $1", [appointment.id]);
        }
      } catch (e) {
        console.error('Stripe checkout session failed:', e.message);
      }
    }

    res.status(201).json({ message: 'Appointment confirmed.', data: appointment, checkoutUrl });
  } catch (err) {
    next(err);
  }
}

// ── Public: manage booking via emailed token (no login required) ──────────

async function getByToken(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT a.*, l.slug AS location_slug, l.city_en AS location_city_en, l.city_ar AS location_city_ar
       FROM appointments a JOIN locations l ON l.id = a.location_id
       WHERE a.manage_token = $1`,
      [req.params.token]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Booking not found.' });
    res.json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
}

async function rescheduleByToken(req, res, next) {
  try {
    const { date, time } = req.body || {};
    if (!date || !time) return res.status(400).json({ message: 'date and time are required.' });

    const { rows } = await pool.query(
      `SELECT a.*, l.slug AS location_slug, l.city_en AS location_city_en, l.city_ar AS location_city_ar, l.id AS loc_id
       FROM appointments a JOIN locations l ON l.id = a.location_id
       WHERE a.manage_token = $1`,
      [req.params.token]
    );
    const existing = rows[0];
    if (!existing) return res.status(404).json({ message: 'Booking not found.' });
    if (existing.status === 'cancelled') {
      return res.status(400).json({ message: 'This booking is already cancelled.' });
    }

    const slots = await getAvailableSlots(existing.loc_id, date, existing.doctor_id);
    if (!slots.includes(time)) {
      return res.status(409).json({ message: 'That time slot is not available. Please choose another.' });
    }

    let updated;
    try {
      const result = await pool.query(
        `UPDATE appointments
         SET appointment_date = $1, appointment_time = $2, reminder_sent_at = NULL, updated_at = now()
         WHERE manage_token = $3
         RETURNING *`,
        [date, time, req.params.token]
      );
      updated = result.rows[0];
    } catch (err) {
      if (err.code === '23505') {
        return res.status(409).json({ message: 'That time slot was just booked by someone else. Please choose another.' });
      }
      throw err;
    }

    const details = { ...updated, locationCityEn: existing.location_city_en, locationCityAr: existing.location_city_ar };
    sendRescheduleConfirmation(details).catch((e) => console.error('Reschedule email failed:', e.message));

    res.json({ message: 'Appointment rescheduled.', data: updated });
  } catch (err) {
    next(err);
  }
}

async function cancelByToken(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT a.*, l.city_en AS location_city_en, l.city_ar AS location_city_ar
       FROM appointments a JOIN locations l ON l.id = a.location_id
       WHERE a.manage_token = $1`,
      [req.params.token]
    );
    const existing = rows[0];
    if (!existing) return res.status(404).json({ message: 'Booking not found.' });

    const { rows: updatedRows } = await pool.query(
      "UPDATE appointments SET status = 'cancelled', updated_at = now() WHERE manage_token = $1 RETURNING *",
      [req.params.token]
    );
    const updated = updatedRows[0];

    sendCancellationConfirmation({ ...updated, locationCityEn: existing.location_city_en })
      .catch((e) => console.error('Cancellation email failed:', e.message));

    notifyNextWaitlistEntry(existing.location_id, existing.appointment_date)
      .catch((e) => console.error('Waitlist notification failed:', e.message));

    res.json({ message: 'Appointment cancelled.', data: updated });
  } catch (err) {
    next(err);
  }
}

// ── Admin ───────────────────────────────────────────────────────────────

async function adminList(req, res, next) {
  try {
    const { location, date, status, doctor } = req.query;
    const clauses = [];
    const values = [];
    if (location) { values.push(location); clauses.push(`l.slug = $${values.length}`); }
    if (date) { values.push(date); clauses.push(`a.appointment_date = $${values.length}`); }
    if (status) { values.push(status); clauses.push(`a.status = $${values.length}`); }
    if (doctor) { values.push(doctor); clauses.push(`a.doctor_id = $${values.length}`); }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const { rows } = await pool.query(
      `SELECT a.*, l.slug AS location_slug, l.city_en AS location_city_en, l.city_ar AS location_city_ar,
              d.name_en AS doctor_name_en
       FROM appointments a
       JOIN locations l ON l.id = a.location_id
       LEFT JOIN doctors d ON d.id = a.doctor_id
       ${where}
       ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
      values
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
}

async function adminUpdateStatus(req, res, next) {
  try {
    const { status } = req.body || {};
    if (!['confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'status must be confirmed, cancelled, or completed.' });
    }
    const { rows } = await pool.query(
      'UPDATE appointments SET status = $1, updated_at = now() WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    const updated = rows[0];
    if (!updated) return res.status(404).json({ message: 'Not found.' });

    if (status === 'cancelled') {
      notifyNextWaitlistEntry(updated.location_id, updated.appointment_date)
        .catch((e) => console.error('Waitlist notification failed:', e.message));
    }

    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  availability, createAppointment, getByToken, rescheduleByToken, cancelByToken,
  adminList, adminUpdateStatus
};
