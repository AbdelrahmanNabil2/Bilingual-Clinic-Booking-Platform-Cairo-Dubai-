let stripeClient = null;

function getClient() {
  if (!process.env.STRIPE_SECRET_KEY) return null; // not configured

  if (!stripeClient) {
    // eslint-disable-next-line global-require
    const Stripe = require('stripe');
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
}

function isConfigured() {
  return !!getClient();
}

/**
 * Creates a Stripe Checkout session for a deposit tied to one appointment.
 * Returns the session (with .url to redirect the patient to) or null if
 * Stripe isn't configured — callers should treat null as "skip payment,
 * proceed without a deposit" rather than blocking the booking, since a
 * missing API key is a deployment/config gap, not the patient's problem.
 */
async function createDepositCheckoutSession({ appointment, depositCents, description, successUrl, cancelUrl }) {
  const stripe = getClient();
  if (!stripe) return null;

  return stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: appointment.email,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: depositCents,
          product_data: { name: description || 'Appointment deposit' }
        },
        quantity: 1
      }
    ],
    metadata: { appointment_id: String(appointment.id) },
    success_url: successUrl,
    cancel_url: cancelUrl
  });
}

function constructWebhookEvent(rawBody, signature) {
  const stripe = getClient();
  if (!stripe) throw new Error('Stripe is not configured.');
  return stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
}

module.exports = { isConfigured, createDepositCheckoutSession, constructWebhookEvent };
