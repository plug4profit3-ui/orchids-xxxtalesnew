import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin, requireAuth } from '../_supabase';

/**
 * GET /api/credits/usage
 * 
 * Returns credit usage history and statistics for the authenticated user.
 * 
 * Query params:
 *   days=30  (default: 30, max: 365)
 * 
 * Response:
 * {
 *   summary: { total_spent, total_purchased, current_balance, ... },
 *   daily_usage: [{ date, credits_spent, api_calls }],
 *   recent_transactions: [{ ... }],
 *   cost_breakdown: { chat, image, tts, story }
 * }
 */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = await requireAuth(req, res);
    if (!userId) return;

    const days = Math.min(parseInt(req.query.days as string) || 30, 365);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Get current balance
    const { data: account } = await supabaseAdmin
      .from('credit_accounts')
      .select('balance, daily_messages_left')
      .eq('user_id', userId)
      .single();

    // Get transactions for the period
    const { data: transactions } = await supabaseAdmin
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(100);

    // Get API usage for the period
    const { data: apiUsage } = await supabaseAdmin
      .from('api_usage')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(200);

    // Calculate summary
    const consumed = (transactions || [])
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const purchased = (transactions || [])
      .filter(t => t.amount > 0 && (t.type === 'purchase' || t.type === 'vip_monthly' || t.type === 'daily_reward'))
      .reduce((sum, t) => sum + t.amount, 0);

    const refunds = (transactions || [])
      .filter(t => t.amount > 0 && t.type === 'adjustment')
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate cost breakdown by type
    const costBreakdown = {
      chat: 0,
      image: 0,
      tts: 0,
      story: 0,
      gift: 0,
      other: 0,
    };

    for (const tx of transactions || []) {
      if (tx.amount >= 0) continue; // Skip credits added
      const refType = tx.reference_type || tx.metadata?.reference_type || '';
      const desc = (tx.description || '').toLowerCase();
      
      if (refType === 'image' || desc.includes('image')) {
        costBreakdown.image += Math.abs(tx.amount);
      } else if (refType === 'tts' || desc.includes('tts') || desc.includes('speech')) {
        costBreakdown.tts += Math.abs(tx.amount);
      } else if (refType === 'story' || desc.includes('story')) {
        costBreakdown.story += Math.abs(tx.amount);
      } else if (refType === 'gift' || desc.includes('gift')) {
        costBreakdown.gift += Math.abs(tx.amount);
      } else {
        costBreakdown.chat += Math.abs(tx.amount);
      }
    }

    // Daily usage aggregation
    const dailyMap: Record<string, { credits_spent: number; api_calls: number }> = {};
    
    for (const tx of transactions || []) {
      const date = tx.created_at?.split('T')[0];
      if (!date) continue;
      if (!dailyMap[date]) dailyMap[date] = { credits_spent: 0, api_calls: 0 };
      if (tx.amount < 0) {
        dailyMap[date].credits_spent += Math.abs(tx.amount);
        dailyMap[date].api_calls++;
      }
    }

    const dailyUsage = Object.entries(dailyMap)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => b.date.localeCompare(a.date));

    // API cost tracking
    const totalApiCostUsd = (apiUsage || []).reduce((sum, u) => sum + (u.cost_usd || 0), 0);
    const totalTokensIn = (apiUsage || []).reduce((sum, u) => sum + (u.tokens_in || 0), 0);
    const totalTokensOut = (apiUsage || []).reduce((sum, u) => sum + (u.tokens_out || 0), 0);

    return res.status(200).json({
      summary: {
        current_balance: account?.balance || 0,
        daily_messages_left: account?.daily_messages_left || 0,
        total_spent: consumed,
        total_purchased: purchased,
        total_refunded: refunds,
        period_days: days,
        api_cost_usd: Math.round(totalApiCostUsd * 100) / 100,
        total_tokens_in: totalTokensIn,
        total_tokens_out: totalTokensOut,
      },
      cost_breakdown: costBreakdown,
      daily_usage: dailyUsage,
      recent_transactions: (transactions || []).slice(0, 20).map(tx => ({
        id: tx.id,
        amount: tx.amount,
        type: tx.type,
        description: tx.description,
        created_at: tx.created_at,
        reference_type: tx.reference_type,
      })),
    });

  } catch (e: any) {
    console.error('Usage handler error:', e);
    return res.status(500).json({ error: e.message || 'Internal server error' });
  }
}
