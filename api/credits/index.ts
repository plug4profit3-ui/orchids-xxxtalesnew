import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin, requireAuth, deductCredits, addCredits, requireCredits } from '../_supabase.js';

/**
 * Consolidated Credits API
 * 
 * GET /api/credits - Get balance
 * POST /api/credits - Add credits (admin)  
 * POST /api/credits/consume - Consume credits for an action
 * GET /api/credits/usage - Get usage statistics
 * POST /api/credits/packages - Purchase credit packages
 * POST /api/credits/adjust - Adjust credits (admin)
 * POST /api/credits/refund - Refund credits (admin)
 */

// GET /api/credits - Get balance
async function handleGetBalance(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const { data: account } = await supabaseAdmin
    .from('credit_accounts')
    .select('*')
    .eq('user_id', userId)
    .single();

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('is_premium, vip_expires_at')
    .eq('id', userId)
    .single();

  const isVip = profile?.is_premium && 
    (!profile.vip_expires_at || new Date(profile.vip_expires_at) > new Date());

  res.status(200).json({
    user_id: userId,
    balance: account?.balance || 0,
    daily_messages_left: account?.daily_messages_left || 0,
    last_updated: account?.updated_at,
    is_premium: isVip,
    vip_expires_at: profile?.vip_expires_at,
  });
}

// POST /api/credits - Add credits (admin only in production, simplified here)
async function handleAddCredits(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const { amount, type, metadata } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  const newBalance = await addCredits(userId, amount, type || 'manual', metadata || {});
  res.status(200).json({ success: true, balance: newBalance });
}

// POST /api/credits/consume - Consume credits
async function handleConsume(req: VercelRequest, res: VercelResponse) {
  const userId = await requireCredits(req, res, 1); // Default cost
  if (!userId) return;

  const { amount = 1, action, metadata = {} } = req.body;

  const { success, newBalance } = await deductCredits(userId, amount, action || 'consumption', metadata);
  
  if (!success) {
    return res.status(402).json({ error: 'Insufficient credits', balance: newBalance });
  }

  res.status(200).json({ success: true, balance: newBalance, consumed: amount });
}

// GET /api/credits/usage - Get usage statistics
async function handleUsage(req: VercelRequest, res: VercelResponse) {
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
    if (tx.amount >= 0) continue;
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

  res.status(200).json({
    summary: {
      current_balance: account?.balance || 0,
      daily_messages_left: account?.daily_messages_left || 0,
      total_spent: consumed,
      total_purchased: purchased,
      total_refunded: refunds,
      period_days: days,
      api_cost_usd: Math.round(totalApiCostUsd * 100) / 100,
    },
    // Business analytics (simulated for demo)
    business: {
      total_users: Math.floor(Math.random() * 5000) + 1000,
      active_daily: Math.floor(Math.random() * 500) + 100,
      active_weekly: Math.floor(Math.random() * 2000) + 500,
      active_monthly: Math.floor(Math.random() * 5000) + 1000,
      revenue: Math.floor(Math.random() * 10000) + 2000,
      top_features: ['Chat', 'Roleplay', 'Images', 'Stories', 'Voice'],
      avg_session_minutes: Math.floor(Math.random() * 15) + 5,
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
}

// POST /api/credits/packages - Get available packages (simplified - real Stripe integration elsewhere)
async function handlePackages(req: VercelRequest, res: VercelResponse) {
  // This would normally redirect to Stripe, but here we just return package info
  res.status(200).json({
    packages: [
      { id: 'starter', credits: 80, price: 499, name: 'Starter' },
      { id: 'popular', credits: 250, price: 999, name: 'Popular' },
      { id: 'intense', credits: 600, price: 1999, name: 'Intense' },
      { id: 'elite', credits: 1500, price: 3999, name: 'Elite' },
    ]
  });
}

// POST /api/credits/adjust - Adjust credits (admin)
async function handleAdjust(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const { target_user_id, amount, reason } = req.body;
  if (!target_user_id || amount === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const newBalance = await addCredits(target_user_id, amount, 'adjustment', { reason: reason || 'Manual adjustment' });
  res.status(200).json({ success: true, balance: newBalance });
}

// POST /api/credits/refund - Refund credits
async function handleRefund(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const { amount, reason } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  const newBalance = await addCredits(userId, amount, 'refund', { reason: reason || 'Refund' });
  res.status(200).json({ success: true, balance: newBalance });
}

// Main handler - route to appropriate function
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = req.query.action as string;

  try {
    // Handle different actions based on query param
    if (req.method === 'GET' && !action) {
      return handleGetBalance(req, res);
    }
    if (req.method === 'GET' && action === 'usage') {
      return handleUsage(req, res);
    }
    if (req.method === 'GET' && action === 'packages') {
      return handlePackages(req, res);
    }
    if (req.method === 'POST') {
      if (action === 'consume') return handleConsume(req, res);
      if (action === 'packages') return handlePackages(req, res);
      if (action === 'adjust') return handleAdjust(req, res);
      if (action === 'refund') return handleRefund(req, res);
      // Default: add credits
      return handleAddCredits(req, res);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Credits API error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}