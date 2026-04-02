import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../_supabase.js';

/**
 * GET /api/credits/packages
 * 
 * Returns available credit packages for purchase.
 * No authentication required (public endpoint).
 * 
 * Response:
 * {
 *   packages: Array<{
 *     id: string,
 *     name: string,
 *     credits_amount: number,
 *     price_eur: number,
 *     price_display: string,
 *     description: string,
 *     stripe_price_id?: string
 *   }>
 * }
 */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data: packages, error } = await supabaseAdmin
      .from('credit_packages')
      .select('id, name, credits_amount, price_eur, description, stripe_price_id')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Packages fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch packages' });
    }

    // Format packages for response
    const formattedPackages = (packages || []).map(pkg => ({
      id: pkg.id,
      name: pkg.name,
      credits_amount: pkg.credits_amount,
      price_eur: pkg.price_eur,
      price_display: `€${(pkg.price_eur / 100).toFixed(2)}`,
      description: pkg.description,
      stripe_price_id: pkg.stripe_price_id,
      // Calculate approximate messages (assuming 1 credit per message on average)
      estimated_messages: Math.floor(pkg.credits_amount),
    }));

    return res.status(200).json({
      packages: formattedPackages,
    });

  } catch (e: any) {
    console.error('Packages handler error:', e);
    return res.status(500).json({ error: e.message || 'Internal server error' });
  }
}
