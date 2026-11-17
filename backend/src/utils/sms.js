let twilioClient = null;

function getClient() {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) return null; // not configured

  if (!twilioClient) {
    // Lazy require so the twilio package never has to initialize (and never
    // needs real credentials) unless someone actually configures it.
    // eslint-disable-next-line global-require
    const twilio = require('twilio');
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return twilioClient;
}

async function sendSms(toPhone, body) {
  const client = getClient();
  if (!client || !toPhone) return;
  const from = process.env.TWILIO_SMS_FROM;
  if (!from) return;

  await client.messages.create({ to: toPhone, from, body });
}

async function sendWhatsApp(toPhone, body) {
  const client = getClient();
  if (!client || !toPhone) return;
  const from = process.env.TWILIO_WHATSAPP_FROM; // e.g. 'whatsapp:+14155238886'
  if (!from) return;

  await client.messages.create({ to: `whatsapp:${toPhone}`, from, body });
}

module.exports = { sendSms, sendWhatsApp };
