// Shared Supabase admin client for API routes
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

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
    .eq('user_id', userId)
    .eq('balance', account.balance); // optimistic lock

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
