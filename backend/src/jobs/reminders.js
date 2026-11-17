const cron = require('node-cron');
const { DateTime } = require('luxon');
const pool = require('../db/pool');
const { sendAppointmentReminder } = require('../utils/mailer');
const { sendSms, sendWhatsApp } = require('../utils/sms');

/**
 * Finds confirmed appointments happening "tomorrow" in each location's own
 * timezone that haven't been reminded yet, and sends a reminder. Marking
 * reminder_sent_at makes this safe to run repeatedly without double-sending.
 */
async function runReminderSweep() {
  const { rows: locations } = await pool.query('SELECT id, city_en, timezone FROM locations');

  for (const loc of locations) {
    const tomorrow = DateTime.now().setZone(loc.timezone).plus({ days: 1 }).toISODate();

    const { rows: appointments } = await pool.query(
      `SELECT * FROM appointments
       WHERE location_id = $1 AND appointment_date = $2
         AND status = 'confirmed' AND reminder_sent_at IS NULL`,
      [loc.id, tomorrow]
    );

    for (const appt of appointments) {
      const details = { ...appt, locationCityEn: loc.city_en };
      try {
        await sendAppointmentReminder(details);
        if (appt.phone) {
          const body = `Reminder: your appointment is tomorrow at ${appt.appointment_time.slice(0, 5)} — ${loc.city_en} clinic.`;
          await sendSms(appt.phone, body).catch(() => {});
          await sendWhatsApp(appt.phone, body).catch(() => {});
        }
        await pool.query('UPDATE appointments SET reminder_sent_at = now() WHERE id = $1', [appt.id]);
      } catch (err) {
        console.error(`Reminder failed for appointment ${appt.id}:`, err.message);
      }
    }
  }
}

/** Runs the sweep once an hour — cheap, and naturally catches any location's "day before" window without needing per-timezone cron entries. */
function startReminderJob() {
  cron.schedule('0 * * * *', () => {
    runReminderSweep().catch((err) => console.error('Reminder sweep failed:', err.message));
  });
}

module.exports = { startReminderJob, runReminderSweep };
