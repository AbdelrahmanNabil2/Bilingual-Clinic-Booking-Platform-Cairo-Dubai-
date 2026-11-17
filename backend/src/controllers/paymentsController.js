const pool = require('../db/pool');
const { constructWebhookEvent } = require('../utils/payments');

async function webhook(req, res) {
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    event = constructWebhookEvent(req.body, signature);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const appointmentId = session.metadata?.appointment_id;
    if (appointmentId) {
      await pool.query(
        "UPDATE appointments SET deposit_status = 'paid', updated_at = now() WHERE id = $1",
        [appointmentId]
      ).catch((e) => console.error('Failed to mark deposit paid:', e.message));
    }
  }

  res.json({ received: true });
}

module.exports = { webhook };
