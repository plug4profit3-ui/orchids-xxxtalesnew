import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { supabaseAdmin } from './_supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
});

const PRICE_MAP: Record<string, { priceId: string; credits: number; amount: number; type: 'one_time' | 'subscription' }> = {
  'starter': { priceId: 'price_1T0T8dLkRK7Wa5UchZI5dvqs', credits: 80, amount: 499, type: 'one_time' },
  'popular': { priceId: 'price_1T0T8eLkRK7Wa5UcuJnHqqEz', credits: 250, amount: 999, type: 'one_time' },
  'intense': { priceId: 'price_1T0T8eLkRK7Wa5Ucoqy3whDs', credits: 600, amount: 1999, type: 'one_time' },
  'elite':   { priceId: 'price_1T0T8fLkRK7Wa5Uc7OOb4ntC', credits: 1500, amount: 3999, type: 'one_time' },
  'vip':     { priceId: 'price_1T0T8dLkRK7Wa5UcwluoAFV3', credits: 400, amount: 1799, type: 'subscription' },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { productKey, userId } = req.body;
    const product = PRICE_MAP[productKey];
    if (!product) {
      return res.status(400).json({ error: 'Invalid product' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: product.amount,
      currency: 'eur',
      metadata: {
        userId,
        credits: String(product.credits),
        productKey,
        type: product.type,
      },
    });

    // Log payment intent to Supabase
    if (userId) {
      await supabaseAdmin.from('payments').insert({
        user_id: userId,
        stripe_payment_intent_id: paymentIntent.id,
        product_key: productKey,
        amount_eur: product.amount,
        credits_granted: product.credits,
        status: 'pending',
      }).catch(() => {});
    }

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      type: product.type,
      credits: product.credits,
    });
  } catch (e: any) {
    console.error('Stripe error:', e.message);
    return res.status(500).json({ error: e.message || 'Internal server error' });
  }
}
