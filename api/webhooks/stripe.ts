import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { supabaseAdmin, addCredits } from '../_supabase.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Disable body parsing for webhook signature verification
export const config = { api: { bodyParser: false } };

async function readBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let event: Stripe.Event;

  try {
    const body = await readBody(req);
    const sig = req.headers['stripe-signature'] as string;
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const userId = pi.metadata?.userId;
        const credits = parseInt(pi.metadata?.credits || '0', 10);
        const productKey = pi.metadata?.productKey;

        if (userId && userId !== 'local_user' && credits > 0) {
          // Check if already processed (idempotency)
          const { data: existing } = await supabaseAdmin
            .from('payments')
            .select('id, status')
            .eq('stripe_payment_intent_id', pi.id)
            .single();

          if (existing?.status === 'succeeded') {
            console.log(`Payment ${pi.id} already processed, skipping`);
            break;
          }

          // Add credits
          const newBalance = await addCredits(userId, credits, 'purchase', {
            product_key: productKey,
            stripe_pi: pi.id,
            amount_eur: pi.amount,
            webhook: true,
          });

          // Update payment record
          await supabaseAdmin
            .from('payments')
            .upsert({
              user_id: userId,
              stripe_payment_intent_id: pi.id,
              product_key: productKey,
              amount_eur: pi.amount,
              credits_granted: credits,
              status: 'succeeded',
            });

          console.log(`✅ Granted ${credits} credits to ${userId}, new balance: ${newBalance}`);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent;
        await supabaseAdmin
          .from('payments')
          .update({ status: 'failed' })
          .eq('stripe_payment_intent_id', pi.id);
        console.log(`❌ Payment failed: ${pi.id}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;

        if (userId) {
          const isActive = subscription.status === 'active';
          const expiresAt = new Date((subscription as any).current_period_end * 1000).toISOString();

          await supabaseAdmin
            .from('profiles')
            .update({
              is_premium: isActive,
              vip_expires_at: expiresAt,
            })
            .eq('id', userId);

          console.log(`🔄 Subscription updated for ${userId}: ${subscription.status}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;

        if (userId) {
          await supabaseAdmin
            .from('profiles')
            .update({
              is_premium: false,
              vip_expires_at: null,
            })
            .eq('id', userId);

          console.log(`🚫 Subscription cancelled for ${userId}`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        // For subscription renewals, grant monthly VIP credits
        const invoiceSubscription = (invoice as any).subscription;
        if (invoiceSubscription && invoice.billing_reason === 'subscription_cycle') {
          const subscription = await stripe.subscriptions.retrieve(
            invoiceSubscription as string
          );
          const userId = subscription.metadata?.userId;

          if (userId) {
            // Grant 400 monthly VIP credits
            await addCredits(userId, 400, 'vip_monthly', {
              subscription_id: subscription.id,
              invoice_id: invoice.id,
              period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
            });
            console.log(`🎁 Granted 400 VIP monthly credits to ${userId}`);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error('Webhook handler error:', err);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
}
