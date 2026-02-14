import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { supabaseAdmin, addCredits } from './_supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { paymentIntentId } = req.body;
    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Missing paymentIntentId' });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      const credits = parseInt(paymentIntent.metadata.credits || '0', 10);
      const productKey = paymentIntent.metadata.productKey || '';
      const userId = paymentIntent.metadata.userId;
      const isSub = productKey === 'vip';

      // Update payment status in Supabase
      await supabaseAdmin
        .from('payments')
        .update({ status: 'succeeded' })
        .eq('stripe_payment_intent_id', paymentIntentId)
        .catch(() => {});

      // Add credits to user's account in Supabase
      if (userId && userId !== 'local_user') {
        const newBalance = await addCredits(userId, credits, 'purchase', {
          product_key: productKey,
          stripe_pi: paymentIntentId,
          amount_eur: paymentIntent.amount,
        });

        // If VIP subscription, update profile
        if (isSub) {
          const vipExpires = new Date();
          vipExpires.setDate(vipExpires.getDate() + 30);
          await supabaseAdmin
            .from('profiles')
            .update({ is_premium: true, vip_expires_at: vipExpires.toISOString() })
            .eq('id', userId);
        }

        return res.status(200).json({
          verified: true,
          credits,
          isSub,
          productKey,
          newBalance,
        });
      }

      return res.status(200).json({
        verified: true,
        credits,
        isSub,
        productKey,
      });
    }

    // Update failed status
    if (paymentIntent.status === 'canceled') {
      await supabaseAdmin
        .from('payments')
        .update({ status: 'failed' })
        .eq('stripe_payment_intent_id', paymentIntentId)
        .catch(() => {});
    }

    return res.status(200).json({ verified: false, status: paymentIntent.status });
  } catch (e: any) {
    console.error('Verify error:', e.message);
    return res.status(500).json({ error: e.message || 'Internal server error' });
  }
}
