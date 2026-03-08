// GET /api/credits-balance
// Returns the current credit balance and recent transactions for the authenticated user.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth, supabaseAdmin } from './_supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = await requireAuth(req, res);
  if (!userId) return; // 401 already sent

  // Fetch balance and recent transactions in parallel
  const [{ data: account }, { data: transactions }] = await Promise.all([
    supabaseAdmin
      .from('credit_accounts')
      .select('balance, daily_messages_left, updated_at')
      .eq('user_id', userId)
      .single(),
    supabaseAdmin
      .from('credit_transactions')
      .select('id, type, amount, description, reference_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  if (!account) {
    // Auto-create account with default balance
    await supabaseAdmin.from('credit_accounts').upsert({
      user_id: userId,
      balance: 50,
      daily_messages_left: 10,
      updated_at: new Date().toISOString(),
    });

    return res.status(200).json({
      balance: 50,
      daily_messages_left: 10,
      transactions: [],
    });
  }

  return res.status(200).json({
    balance: Number(account.balance),
    daily_messages_left: account.daily_messages_left ?? 10,
    updated_at: account.updated_at,
    transactions: (transactions || []).map(t => ({
      id: t.id,
      type: t.type,
      amount: Number(t.amount),
      description: t.description,
      reference_id: t.reference_id,
      created_at: t.created_at,
    })),
  });
}
