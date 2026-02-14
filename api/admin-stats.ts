import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from './_supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Simple admin auth check via query param (replace with proper auth in production)
  const adminKey = req.query.key;
  if (adminKey !== process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(-10)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // 1. Total users
    const { count: totalUsers } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // 2. Total revenue (EUR cents)
    const { data: revenueData } = await supabaseAdmin
      .from('payments')
      .select('amount_eur')
      .eq('status', 'succeeded');
    const totalRevenueEur = (revenueData || []).reduce((sum, p) => sum + (p.amount_eur || 0), 0) / 100;

    // 3. Total API costs (USD)
    const { data: costData } = await supabaseAdmin
      .from('api_usage')
      .select('cost_usd, service');
    const totalCostUsd = (costData || []).reduce((sum, u) => sum + Number(u.cost_usd || 0), 0);

    // 4. Costs per service
    const costsByService: Record<string, { calls: number; cost_usd: number }> = {};
    for (const row of costData || []) {
      if (!costsByService[row.service]) costsByService[row.service] = { calls: 0, cost_usd: 0 };
      costsByService[row.service].calls++;
      costsByService[row.service].cost_usd += Number(row.cost_usd || 0);
    }

    // 5. Revenue per product
    const revenueByProduct: Record<string, { count: number; total_eur: number }> = {};
    for (const row of revenueData || []) {
      const key = (row as any).product_key || 'unknown';
      if (!revenueByProduct[key]) revenueByProduct[key] = { count: 0, total_eur: 0 };
      revenueByProduct[key].count++;
      revenueByProduct[key].total_eur += (row.amount_eur || 0) / 100;
    }

    // 6. Recent API usage (last 24h)
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    const { data: recentUsage } = await supabaseAdmin
      .from('api_usage')
      .select('service, cost_usd')
      .gte('created_at', yesterday);
    const last24hCost = (recentUsage || []).reduce((sum, u) => sum + Number(u.cost_usd || 0), 0);
    const last24hCalls = recentUsage?.length || 0;

    // 7. Top users by cost
    const userCosts: Record<string, number> = {};
    for (const row of costData || []) {
      const uid = (row as any).user_id || 'unknown';
      userCosts[uid] = (userCosts[uid] || 0) + Number(row.cost_usd || 0);
    }
    const topCostUsers = Object.entries(userCosts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([userId, cost]) => ({ userId, cost_usd: cost }));

    // 8. Profit calculation
    const profitEur = totalRevenueEur - (totalCostUsd * 0.92); // USD to EUR approx

    return res.status(200).json({
      summary: {
        total_users: totalUsers || 0,
        total_revenue_eur: Math.round(totalRevenueEur * 100) / 100,
        total_cost_usd: Math.round(totalCostUsd * 10000) / 10000,
        profit_eur: Math.round(profitEur * 100) / 100,
        margin_pct: totalRevenueEur > 0 ? Math.round((profitEur / totalRevenueEur) * 10000) / 100 : 0,
      },
      last_24h: {
        api_calls: last24hCalls,
        cost_usd: Math.round(last24hCost * 10000) / 10000,
      },
      costs_by_service: costsByService,
      revenue_by_product: revenueByProduct,
      top_cost_users: topCostUsers,
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
