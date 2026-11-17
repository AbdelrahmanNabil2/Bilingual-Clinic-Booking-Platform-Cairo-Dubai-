const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (!process.env.SMTP_HOST) return null; // email sending disabled — not configured

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined
    });
  }
  return transporter;
}

const FROM = () => `"Clinic Website" <${process.env.SMTP_USER || 'no-reply@clinicname.com'}>`;

function manageUrl(token) {
  const base = process.env.FRONTEND_ORIGIN?.split(',')[0] || 'http://localhost:3000';
  return `${base}/en/booking/manage/${token}`;
}

async function sendContactNotification({ name, email, phone, preferredLocation, message }) {
  const t = getTransporter();
  if (!t) return;
  const to = process.env.CONTACT_NOTIFY_EMAIL;
  if (!to) return;

  await t.sendMail({
    from: FROM(),
    to,
    replyTo: email,
    subject: `New contact form submission — ${name}`,
    text: [
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone || '—'}`,
      `Preferred location: ${preferredLocation}`,
      '',
      message
    ].join('\n')
  });
}

async function sendBookingConfirmation(appt) {
  const t = getTransporter();
  if (!t) return;

  const lines = [
    `Hi ${appt.patient_name},`,
    '',
    `Your appointment is confirmed for ${appt.appointment_date} at ${appt.appointment_time.slice(0, 5)}`,
    `at our ${appt.locationCityEn} clinic.`
  ];
  if (appt.manage_token) {
    lines.push('', `Need to reschedule or cancel? Manage your booking here: ${manageUrl(appt.manage_token)}`);
  }
  lines.push('', 'See you soon!');

  await t.sendMail({
    from: FROM(),
    to: appt.email,
    subject: `Appointment confirmed — ${appt.appointment_date} at ${appt.appointment_time.slice(0, 5)}`,
    text: lines.join('\n')
  });
}

async function sendBookingNotification(appt) {
  const t = getTransporter();
  if (!t) return;
  const to = process.env.BOOKING_NOTIFY_EMAIL || process.env.CONTACT_NOTIFY_EMAIL;
  if (!to) return;

  await t.sendMail({
    from: FROM(),
    to,
    replyTo: appt.email,
    subject: `New booking — ${appt.locationCityEn} — ${appt.appointment_date} ${appt.appointment_time.slice(0, 5)}`,
    text: [
      `Patient: ${appt.patient_name}`,
      `Email: ${appt.email}`,
      `Phone: ${appt.phone || '—'}`,
      `Location: ${appt.locationCityEn}`,
      `Date: ${appt.appointment_date}`,
      `Time: ${appt.appointment_time.slice(0, 5)}`,
      appt.notes ? `Notes: ${appt.notes}` : null
    ].filter(Boolean).join('\n')
  });
}

async function sendRescheduleConfirmation(appt) {
  const t = getTransporter();
  if (!t) return;

  await t.sendMail({
    from: FROM(),
    to: appt.email,
    subject: `Appointment rescheduled — now ${appt.appointment_date} at ${appt.appointment_time.slice(0, 5)}`,
    text: [
      `Hi ${appt.patient_name},`,
      '',
      `Your appointment has been moved to ${appt.appointment_date} at ${appt.appointment_time.slice(0, 5)}`,
      `at our ${appt.locationCityEn} clinic.`,
      '',
      appt.manage_token ? `Manage your booking here: ${manageUrl(appt.manage_token)}` : null,
      '',
      'See you soon!'
    ].filter((l) => l !== null).join('\n')
  });
}

async function sendCancellationConfirmation(appt) {
  const t = getTransporter();
  if (!t) return;

  await t.sendMail({
    from: FROM(),
    to: appt.email,
    subject: 'Your appointment has been cancelled',
    text: [
      `Hi ${appt.patient_name},`,
      '',
      `Your appointment on ${appt.appointment_date} at ${appt.appointment_time.slice(0, 5)} at our ${appt.locationCityEn} clinic has been cancelled.`,
      '',
      'If this was a mistake, feel free to book a new appointment any time.'
    ].join('\n')
  });
}

async function sendAppointmentReminder(appt) {
  const t = getTransporter();
  if (!t) return;

  await t.sendMail({
    from: FROM(),
    to: appt.email,
    subject: `Reminder: your appointment is tomorrow at ${appt.appointment_time.slice(0, 5)}`,
    text: [
      `Hi ${appt.patient_name},`,
      '',
      `Just a reminder that your appointment is tomorrow, ${appt.appointment_date}, at ${appt.appointment_time.slice(0, 5)}`,
      `at our ${appt.locationCityEn} clinic.`,
      '',
      appt.manage_token ? `Need to reschedule? ${manageUrl(appt.manage_token)}` : null,
      '',
      'See you soon!'
    ].filter((l) => l !== null).join('\n')
  });
}

async function sendPasswordResetEmail(admin, resetUrl) {
  const t = getTransporter();
  if (!t) return;

  await t.sendMail({
    from: FROM(),
    to: admin.email,
    subject: 'Reset your admin password',
    text: [
      `Hi ${admin.name},`,
      '',
      'A password reset was requested for your Clinic Admin account.',
      `Reset it here (valid for 1 hour): ${resetUrl}`,
      '',
      "If you didn't request this, you can safely ignore this email."
    ].join('\n')
  });
}

async function sendWaitlistSlotAvailable(entry, slotTime) {
  const t = getTransporter();
  if (!t) return;

  await t.sendMail({
    from: FROM(),
    to: entry.email,
    subject: `A slot just opened up on ${entry.requested_date}`,
    text: [
      `Hi ${entry.patient_name},`,
      '',
      `A ${slotTime} appointment opened up on ${entry.requested_date}. Book quickly — it may not last!`,
    ].join('\n')
  });
}

module.exports = {
  sendContactNotification,
  sendBookingConfirmation,
  sendBookingNotification,
  sendRescheduleConfirmation,
  sendCancellationConfirmation,
  sendAppointmentReminder,
  sendPasswordResetEmail,
  sendWaitlistSlotAvailable
};
