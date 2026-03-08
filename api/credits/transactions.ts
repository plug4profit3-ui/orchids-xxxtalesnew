import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin, requireAuth } from '../_supabase';

/**
 * GET /api/credits/transactions
 * 
 * Returns transaction history for the authenticated user.
 * Supports pagination with limit and offset.
 * 
 * Query params:
 *   limit: number (default: 20, max: 100)
 *   offset: number (default: 0)
 *   type: string (optional filter: 'purchase', 'consumption', 'refund', 'bonus')
 * 
 * Response:
 * {
 *   transactions: Array<{
 *     id: string,
 *     type: string,
 *     amount: number,
 *     description: string,
 *     reference_type: string,
 *     reference_id: string,
 *     created_at: string,
 *     metadata: object
 *   }>,
 *   total: number,
 *   has_more: boolean
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

    // Parse pagination params
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    const typeFilter = req.query.type as string | undefined;

    // Build query
    let query = supabaseAdmin
      .from('credit_transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply type filter if provided
    if (typeFilter) {
      query = query.eq('type', typeFilter);
    }

    const { data: transactions, error, count } = await query;

    if (error) {
      console.error('Transactions fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch transactions' });
    }

    // Format transactions for response
    const formattedTransactions = (transactions || []).map(tx => ({
      id: tx.id,
      type: tx.type,
      amount: tx.amount,
      description: tx.description,
      reference_type: tx.reference_type,
      reference_id: tx.reference_id,
      estimated_tokens: tx.estimated_tokens,
      actual_tokens: tx.actual_tokens,
      created_at: tx.created_at,
      metadata: tx.metadata,
    }));

    const total = count || 0;
    const hasMore = offset + limit < total;

    return res.status(200).json({
      transactions: formattedTransactions,
      total,
      has_more: hasMore,
      pagination: {
        limit,
        offset,
        next_offset: hasMore ? offset + limit : null,
      },
    });

  } catch (e: any) {
    console.error('Transactions handler error:', e);
    return res.status(500).json({ error: e.message || 'Internal server error' });
  }
}
