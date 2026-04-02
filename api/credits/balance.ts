import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin, requireAuth } from '../_supabase.js';

/**
 * GET /api/credits/balance
 * 
 * Returns current credit balance for the authenticated user.
 * 
 * Response:
 * {
 *   user_id: string,
 *   balance: number,
 *   daily_messages_left: number,
 *   last_updated: string,
 *   is_premium: boolean,
 *   vip_expires_at?: string
 * }
 */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Require authentication
    const userId = await requireAuth(req, res);
    if (!userId) return; // 401 already sent

    // Get current balance and account info
    const { data: account, error: accountError } = await supabaseAdmin
      .from('credit_accounts')
      .select('balance, daily_messages_left, last_reset_at, updated_at')
      .eq('user_id', userId)
      .single();

    if (accountError) {
      console.error('Balance fetch error:', accountError);
      return res.status(500).json({ error: 'Failed to fetch balance' });
    }

    // Get user profile info
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('is_premium, vip_expires_at, trial_used, streak, last_login_date')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return res.status(500).json({ error: 'Failed to fetch profile' });
    }

    // Calculate days until balance expiry (12 months from last purchase)
    const balanceExpiry = account?.updated_at 
      ? new Date(new Date(account.updated_at).setMonth(new Date(account.updated_at).getMonth() + 12))
      : null;

    const daysUntilExpiry = balanceExpiry 
      ? Math.ceil((balanceExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;

    return res.status(200).json({
      user_id: userId,
      balance: account?.balance || 0,
      daily_messages_left: account?.daily_messages_left || 10,
      last_updated: account?.updated_at || new Date().toISOString(),
      is_premium: profile?.is_premium || false,
      vip_expires_at: profile?.vip_expires_at || null,
      trial_used: profile?.trial_used || false,
      streak: profile?.streak || 0,
      last_login_date: profile?.last_login_date || null,
      days_until_expiry: daysUntilExpiry,
    });

  } catch (e: any) {
    console.error('Balance handler error:', e);
    return res.status(500).json({ error: e.message || 'Internal server error' });
  }
}
