import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { requireAuth } from './_supabase';
import { finalizeSuccessfulPayment, markPaymentFailed } from './_payments';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const requesterId = await requireAuth(req, res);
  if (!requesterId) return;

  try {
    const { paymentIntentId } = req.body || {};
    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Missing paymentIntentId' });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const metaUserId = paymentIntent.metadata?.userId;

    if (!metaUserId || metaUserId !== requesterId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (paymentIntent.status === 'succeeded') {
      const result = await finalizeSuccessfulPayment(paymentIntent);
      return res.status(200).json({
        verified: true,
        credits: result.credits ?? 0,
        isSub: result.isSub ?? false,
        productKey: result.productKey ?? '',
        newBalance: result.newBalance,
        alreadyProcessed: Boolean(result.alreadyProcessed),
      });
    }

    if (paymentIntent.status === 'canceled') {
      await markPaymentFailed(paymentIntentId);
    }

    return res.status(200).json({ verified: false, status: paymentIntent.status });
  } catch (e: any) {
    console.error('Verify error:', e.message);
    return res.status(500).json({ error: e.message || 'Internal server error' });
  }
}
