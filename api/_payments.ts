import Stripe from 'stripe';
import { addCredits, supabaseAdmin } from './_supabase';

function extractMetadata(meta: Stripe.Metadata | null | undefined) {
  return {
    credits: parseInt(meta?.credits || '0', 10),
    productKey: meta?.productKey || '',
    userId: meta?.userId || '',
    isSub: (meta?.productKey || '') === 'vip',
  };
}

async function isAlreadyCredited(paymentIntentId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('credit_transactions')
    .select('id')
    .eq('type', 'purchase')
    .eq('metadata->>stripe_pi', paymentIntentId)
    .limit(1)
    .maybeSingle();

  return Boolean(data?.id);
}

export async function finalizeSuccessfulPayment(paymentIntent: Stripe.PaymentIntent) {
  const { credits, productKey, userId, isSub } = extractMetadata(paymentIntent.metadata);

  if (!userId) {
    return { applied: false, reason: 'missing_user' as const };
  }

  const alreadyCredited = await isAlreadyCredited(paymentIntent.id);

  await supabaseAdmin
    .from('payments')
    .update({ status: 'succeeded' })
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .catch(() => {});

  if (alreadyCredited) {
    return { applied: false, alreadyProcessed: true, credits, productKey, isSub };
  }

  const newBalance = await addCredits(userId, credits, 'purchase', {
    product_key: productKey,
    stripe_pi: paymentIntent.id,
    amount_eur: paymentIntent.amount,
    source: 'stripe_webhook_or_verify',
  });

  if (isSub) {
    const vipExpires = new Date();
    vipExpires.setDate(vipExpires.getDate() + 30);
    await supabaseAdmin
      .from('profiles')
      .update({ is_premium: true, vip_expires_at: vipExpires.toISOString() })
      .eq('id', userId)
      .catch(() => {});
  }

  return {
    applied: true,
    alreadyProcessed: false,
    credits,
    productKey,
    isSub,
    newBalance,
    userId,
  };
}

export async function markPaymentFailed(paymentIntentId: string) {
  await supabaseAdmin
    .from('payments')
    .update({ status: 'failed' })
    .eq('stripe_payment_intent_id', paymentIntentId)
    .catch(() => {});
}
