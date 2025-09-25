import Stripe from 'stripe';

// Initialize Stripe with your secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

// Stripe price IDs for your products
export const STRIPE_PRICE_IDS = {
  pro: 'price_pro_monthly', // You'll need to create this in Stripe Dashboard
  lifetime: 'price_lifetime', // You'll need to create this in Stripe Dashboard
};

// Create a checkout session
export async function createCheckoutSession(
  priceId: string,
  customerEmail?: string,
  successUrl?: string,
  cancelUrl?: string
) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: priceId === STRIPE_PRICE_IDS.lifetime ? 'payment' : 'subscription',
    success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/app?success=true`,
    cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/app?canceled=true`,
    customer_email: customerEmail,
    metadata: {
      plan: priceId === STRIPE_PRICE_IDS.lifetime ? 'lifetime' : 'pro',
    },
  });

  return session;
}

// Create a customer portal session
export async function createCustomerPortalSession(customerId: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/app`,
  });

  return session;
}

// Verify webhook signature
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
) {
  try {
    return stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (err) {
    throw new Error(`Webhook signature verification failed: ${err}`);
  }
}
