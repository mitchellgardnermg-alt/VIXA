# Stripe Setup Guide

## 1. Create Stripe Account
1. Go to https://stripe.com and create an account
2. Get your API keys from the dashboard

## 2. Environment Variables
Add these to your `.env.local` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 3. Create Products in Stripe Dashboard

### Pro Plan (Monthly Subscription)
1. Go to Products → Create Product
2. Name: "Vixa Pro"
3. Price: $8.99/month
4. Copy the price ID and update `STRIPE_PRICE_IDS.pro` in `/src/lib/stripe.ts`

### Lifetime Plan (One-time Payment)
1. Go to Products → Create Product
2. Name: "Vixa Lifetime"
3. Price: $44.99 (one-time)
4. Copy the price ID and update `STRIPE_PRICE_IDS.lifetime` in `/src/lib/stripe.ts`

## 4. Set Up Webhooks
1. Go to Webhooks → Add endpoint
2. URL: `https://yourdomain.com/api/stripe/webhook`
3. Events to send:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the webhook secret to `STRIPE_WEBHOOK_SECRET`

## 5. Test the Integration
1. Use Stripe test cards:
   - Success: 4242 4242 4242 4242
   - Decline: 4000 0000 0000 0002
2. Test the subscription flow
3. Verify webhook events are received

## Pricing Structure
- **Free**: 3 exports/day, all features
- **Pro**: $8.99/month, 20 exports/day, priority processing
- **Lifetime**: $44.99 one-time, unlimited exports, all future features

## Revenue Projections
- 100 free users → 0 revenue
- 50 pro users → $449.50/month
- 20 lifetime users → $899.80 one-time
- Total potential: $1,349.30/month + lifetime sales
