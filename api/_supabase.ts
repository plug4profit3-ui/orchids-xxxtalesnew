// Shared Supabase admin client for API routes
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Require a valid Bearer token. Returns userId or sends 401.
export async function requireAuth(
  req: VercelRequest,
  res: VercelResponse
): Promise<string | null> {
  const userId = await getUserIdFromAuth(req.headers.authorization);
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  return userId;
}

// Require credits server-side before calling the AI.
// Returns the verified userId or sends 402 if insufficient credits.
export async function requireCredits(
  req: VercelRequest,
  res: VercelResponse,
  cost: number
): Promise<string | null> {
  const userId = await requireAuth(req, res);
  if (!userId) return null; // 401 already sent

  // VIP users skip credit check
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('is_premium, vip_expires_at')
    .eq('id', userId)
    .single();

  const isVip = profile?.is_premium &&
    (!profile.vip_expires_at || new Date(profile.vip_expires_at) > new Date());

  if (isVip) return userId; // unlimited

  const { data: account } = await supabaseAdmin
    .from('credit_accounts')
    .select('balance')
    .eq('user_id', userId)
    .single();

  if (!account || account.balance < cost) {
    res.status(402).json({ error: 'Insufficient credits', balance: account?.balance ?? 0 });
    return null;
  }

  // Atomic deduction
  const { success } = await deductCredits(userId, cost, 'api_call', { endpoint: req.url });
  if (!success) {
    res.status(402).json({ error: 'Insufficient credits' });
    return null;
  }

  return userId;
}

// Cost constants
export const COSTS = {
  VENICE_CHAT_INPUT_PER_M: 0.40,   // $/M tokens
  VENICE_CHAT_OUTPUT_PER_M: 1.00,  // $/M tokens
  VENICE_IMAGE: 0.01,              // $ per image
  DEEPGRAM_TTS_PER_K_CHARS: 0.03, // $ per 1000 chars
};

// Extract user ID from Authorization header (Bearer token)
export async function getUserIdFromAuth(authHeader: string | undefined): Promise<string | null> {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const { data } = await supabaseAdmin.auth.getUser(token);
  return data.user?.id || null;
}

// Deduct credits atomically
export async function deductCredits(
  userId: string,
  amount: number,
  type: string,
  metadata: Record<string, any> = {}
): Promise<{ success: boolean; newBalance: number }> {
  // Atomic update with check
  const { data: account, error: fetchErr } = await supabaseAdmin
    .from('credit_accounts')
    .select('balance')
    .eq('user_id', userId)
    .single();

  if (fetchErr || !account) return { success: false, newBalance: 0 };
  if (account.balance < amount) return { success: false, newBalance: account.balance };

  const newBalance = account.balance - amount;
  const { error: updateErr } = await supabaseAdmin
    .from('credit_accounts')
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq('user_id', userId);

  if (updateErr) return { success: false, newBalance: account.balance };

  // Log transaction
  await supabaseAdmin.from('credit_transactions').insert({
    user_id: userId,
    amount: -amount,
    type,
    metadata,
  });

  return { success: true, newBalance };
}

// Add credits
export async function addCredits(
  userId: string,
  amount: number,
  type: string,
  metadata: Record<string, any> = {}
): Promise<number> {
  const { data: account } = await supabaseAdmin
    .from('credit_accounts')
    .select('balance')
    .eq('user_id', userId)
    .single();

  const currentBalance = account?.balance || 0;
  const newBalance = currentBalance + amount;

  await supabaseAdmin
    .from('credit_accounts')
    .upsert({
      user_id: userId,
      balance: newBalance,
      updated_at: new Date().toISOString(),
    });

  await supabaseAdmin.from('credit_transactions').insert({
    user_id: userId,
    amount,
    type,
    metadata,
  });

  return newBalance;
}

// Log API usage
export async function logApiUsage(
  userId: string,
  service: string,
  data: {
    tokens_in?: number;
    tokens_out?: number;
    characters?: number;
    cost_usd: number;
    metadata?: Record<string, any>;
  }
) {
  await supabaseAdmin.from('api_usage').insert({
    user_id: userId,
    service,
    tokens_in: data.tokens_in,
    tokens_out: data.tokens_out,
    characters: data.characters,
    cost_usd: data.cost_usd,
    metadata: data.metadata || {},
  });
}
