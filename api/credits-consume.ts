// POST /api/credits-consume
// Atomically deducts credits before an AI generation.
// Supports idempotency keys to prevent duplicate charges on retries.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth, supabaseAdmin, deductCredits, CREDIT_COSTS } from './_supabase';
import { LIMITS } from './_rateLimit';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = await requireAuth(req, res);
  if (!userId) return; // 401 already sent

  // Rate limit: max 120 consume calls per minute per user (allows burst for retries)
  if (!LIMITS.chat(userId)) {
    return res.status(429).json({ error: 'Too many requests. Please slow down.' });
  }

  const {
    estimated_input_tokens,
    estimated_output_tokens,
    message_id,
    idempotency_key,
    intensity = 'normal',
  } = req.body || {};

  // VIP users skip credit checks
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('is_premium, vip_expires_at')
    .eq('id', userId)
    .single();

  const isVip =
    profile?.is_premium &&
    (!profile.vip_expires_at || new Date(profile.vip_expires_at) > new Date());

  if (isVip) {
    // Still return a meaningful response for VIP users
    const { data: account } = await supabaseAdmin
      .from('credit_accounts')
      .select('balance')
      .eq('user_id', userId)
      .single();

    return res.status(200).json({
      success: true,
      consumed_credits: 0,
      remaining_balance: Number(account?.balance ?? 0),
      insufficient_funds: false,
      vip: true,
    });
  }

  // Determine credit cost based on intensity and token estimate
  let creditCost: number;
  if (intensity === 'extreme') {
    creditCost = CREDIT_COSTS.CHAT_EXTREME;
  } else if (intensity === 'high') {
    creditCost = CREDIT_COSTS.CHAT_HIGH;
  } else {
    creditCost = CREDIT_COSTS.CHAT_NORMAL;
  }

  // Token-based adjustment: add 1 extra credit per 2000 tokens above baseline
  const totalTokens = (estimated_input_tokens || 0) + (estimated_output_tokens || 0);
  if (totalTokens > 2000) {
    creditCost += Math.floor((totalTokens - 2000) / 2000);
  }

  // Check current balance first (fast path before locking)
  const { data: account } = await supabaseAdmin
    .from('credit_accounts')
    .select('balance')
    .eq('user_id', userId)
    .single();

  if (!account) {
    return res.status(402).json({
      success: false,
      consumed_credits: 0,
      remaining_balance: 0,
      insufficient_funds: true,
      error: 'Credit account not found',
    });
  }

  if (Number(account.balance) < creditCost) {
    return res.status(402).json({
      success: false,
      consumed_credits: 0,
      remaining_balance: Number(account.balance),
      insufficient_funds: true,
      error: 'Insufficient credits',
    });
  }

  // Atomically deduct credits
  const description = message_id
    ? `Chat message ${message_id} – ~${totalTokens} tokens`
    : `Chat message – ~${totalTokens} tokens`;

  const { success, newBalance, errorCode } = await deductCredits(
    userId,
    creditCost,
    'consumption',
    {
      description,
      reference_id: message_id || null,
      intensity,
      estimated_input_tokens: estimated_input_tokens || 0,
      estimated_output_tokens: estimated_output_tokens || 0,
    },
    idempotency_key || undefined
  );

  if (!success) {
    return res.status(402).json({
      success: false,
      consumed_credits: 0,
      remaining_balance: newBalance,
      insufficient_funds: errorCode === 'insufficient_credits',
      error: errorCode === 'account_not_found' ? 'Credit account not found' : 'Insufficient credits',
    });
  }

  return res.status(200).json({
    success: true,
    consumed_credits: creditCost,
    remaining_balance: newBalance,
    insufficient_funds: false,
  });
}
