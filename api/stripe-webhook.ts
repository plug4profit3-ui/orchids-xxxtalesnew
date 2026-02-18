import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { finalizeSuccessfulPayment, markPaymentFailed } from './_payments';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
});

function toRawBody(body: unknown): string {
  if (typeof body === 'string') return body;
  if (Buffer.isBuffer(body)) return body.toString('utf8');
  return JSON.stringify(body ?? {});
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const signature = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (!signature || !webhookSecret) {
      return res.status(400).json({ error: 'Missing Stripe signature or webhook secret' });
    }

    const rawBody = toRawBody(req.body);
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    console.error('Stripe webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Invalid webhook signature' });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await finalizeSuccessfulPayment(paymentIntent);
        break;
      }
      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await markPaymentFailed(paymentIntent.id);
        break;
      }
      default:
        break;
    }

    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error('Stripe webhook processing error:', err.message);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}
