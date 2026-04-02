import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin, requireAuth, addCredits } from '../_supabase.js';

/**
 * POST /api/credits/refund
 * 
 * Refunds credits for a failed API call.
 * Only works for transactions within the last 5 minutes.
 * 
 * Request body:
 * {
 *   request_id: string,       // The request_id from consume
 *   reason: string,           // 'api_error', 'timeout', etc.
 * }
 */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = await requireAuth(req, res);
    if (!userId) return;

    const { request_id, reason = 'api_error' } = req.body || {};

    if (!request_id) {
      return res.status(400).json({ error: 'request_id is required' });
    }

    // Find the original consumption transaction
    const { data: tx, error: txError } = await supabaseAdmin
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('request_id', request_id)
      .eq('type', 'consumption')
      .single();

    if (txError || !tx) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Check if already refunded
    const { data: existingRefund } = await supabaseAdmin
      .from('credit_transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('reference_id', tx.id)
      .eq('type', 'refund')
      .single();

    if (existingRefund) {
      return res.status(409).json({ error: 'Already refunded' });
    }

    // Check if within 5 minute window
    const txAge = Date.now() - new Date(tx.created_at).getTime();
    if (txAge > 5 * 60 * 1000) {
      return res.status(400).json({ error: 'Refund window expired (5 minutes)' });
    }

    const refundAmount = Math.abs(tx.amount);

    // Add credits back
    const newBalance = await addCredits(userId, refundAmount, 'refund', {
      reason,
      original_transaction_id: tx.id,
      request_id,
      description: `Refund: ${reason}`,
    });

    return res.status(200).json({
      success: true,
      refunded: refundAmount,
      new_balance: newBalance,
      reason,
    });

  } catch (e: any) {
    console.error('Refund handler error:', e);
    return res.status(500).json({ error: e.message || 'Internal server error' });
  }
}
