import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin, requireAuth } from '../_supabase';

/**
 * POST /api/credits/adjust
 * 
 * Adjusts a previous credit consumption based on actual token usage.
 * Used after an API call completes to correct the estimated cost.
 * 
 * Request body:
 * {
 *   request_id: string,  // The request_id from the original consume call
 *   actual_input_tokens: number,
 *   actual_output_tokens: number,
 *   message_id: string (optional)
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   adjustment: number,  // Positive = refund, Negative = additional charge
 *   new_balance: number,
 *   original_consumed: number,
 *   final_consumed: number
 * }
 */

// Same calculation as consume.ts
const CREDIT_COSTS = {
  BASE: {
    normal: 1,
    high: 5,
    extreme: 10,
  },
  TOKENS_PER_1K: 0.5,
  MINIMUM: 0.1,
};

function calculateCredits(
  inputTokens: number,
  outputTokens: number,
  intensity: 'normal' | 'high' | 'extreme' = 'normal'
): number {
  const baseCost = CREDIT_COSTS.BASE[intensity] || CREDIT_COSTS.BASE.normal;
  const totalTokens = inputTokens + outputTokens;
  let tokenCost = 0;
  
  if (totalTokens > 2000) {
    const excessTokens = totalTokens - 2000;
    tokenCost = (excessTokens / 1000) * CREDIT_COSTS.TOKENS_PER_1K;
  }
  
  const totalCost = baseCost + tokenCost;
  return Math.max(CREDIT_COSTS.MINIMUM, Math.round(totalCost * 100) / 100);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Require authentication
    const userId = await requireAuth(req, res);
    if (!userId) return; // 401 already sent

    const {
      request_id,
      actual_input_tokens,
      actual_output_tokens,
      message_id,
      intensity = 'normal',
    } = req.body || {};

    // Validate inputs
    if (!request_id) {
      return res.status(400).json({ error: 'request_id is required' });
    }

    if (actual_input_tokens === undefined || actual_output_tokens === undefined) {
      return res.status(400).json({ error: 'actual_input_tokens and actual_output_tokens are required' });
    }

    // Find the original transaction
    const { data: originalTx, error: txError } = await supabaseAdmin
      .from('credit_transactions')
      .select('*')
      .eq('request_id', request_id)
      .eq('user_id', userId)
      .single();

    if (txError || !originalTx) {
      return res.status(404).json({ 
        error: 'Original transaction not found',
        message: 'Could not find the original credit consumption for this request_id'
      });
    }

    // Check if already adjusted
    if (originalTx.actual_tokens !== null) {
      return res.status(409).json({
        error: 'Already adjusted',
        message: 'This transaction has already been adjusted',
        original_transaction: {
          id: originalTx.id,
          estimated_tokens: originalTx.estimated_tokens,
          actual_tokens: originalTx.actual_tokens,
        },
      });
    }

    // Calculate final cost based on actual tokens
    const finalCredits = calculateCredits(
      actual_input_tokens,
      actual_output_tokens,
      intensity
    );

    const originalCredits = Math.abs(originalTx.amount);
    const adjustment = originalCredits - finalCredits; // Positive = overcharged (refund), Negative = undercharged

    // Start a transaction for atomicity
    const { data: result, error: adjustError } = await supabaseAdmin.rpc('adjust_credit_consumption', {
      p_transaction_id: originalTx.id,
      p_user_id: userId,
      p_adjustment: adjustment,
      p_actual_tokens: actual_input_tokens + actual_output_tokens,
      p_final_credits: finalCredits,
    });

    // If RPC doesn't exist, do it manually
    if (adjustError?.message?.includes('function') || adjustError?.code === '42883') {
      // Manual adjustment
      const { data: account, error: accountError } = await supabaseAdmin
        .from('credit_accounts')
        .select('balance')
        .eq('user_id', userId)
        .single();

      if (accountError) {
        return res.status(500).json({ error: 'Failed to fetch account' });
      }

      const newBalance = account.balance + adjustment;

      // Update account balance
      const { error: updateError } = await supabaseAdmin
        .from('credit_accounts')
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        return res.status(500).json({ error: 'Failed to update balance' });
      }

      // Update original transaction with actual tokens
      await supabaseAdmin
        .from('credit_transactions')
        .update({ 
          actual_tokens: actual_input_tokens + actual_output_tokens,
          metadata: {
            ...originalTx.metadata,
            adjusted: true,
            adjustment_amount: adjustment,
            original_amount: originalCredits,
            final_amount: finalCredits,
            adjusted_at: new Date().toISOString(),
          }
        })
        .eq('id', originalTx.id);

      // Log adjustment transaction if there's a significant difference (>0.1 credits)
      if (Math.abs(adjustment) > 0.1) {
        await supabaseAdmin.from('credit_transactions').insert({
          user_id: userId,
          amount: adjustment,
          type: 'adjustment',
          description: `Adjustment for request ${request_id}: ${adjustment > 0 ? 'refund' : 'additional charge'}`,
          reference_type: 'adjustment',
          reference_id: message_id || originalTx.reference_id,
          metadata: {
            original_transaction_id: originalTx.id,
            request_id,
            original_credits: originalCredits,
            final_credits: finalCredits,
            adjustment,
            actual_tokens: actual_input_tokens + actual_output_tokens,
          },
        });
      }

      return res.status(200).json({
        success: true,
        adjustment,
        new_balance: newBalance,
        original_consumed: originalCredits,
        final_consumed: finalCredits,
        refund_applied: adjustment > 0,
        additional_charge: adjustment < 0 ? Math.abs(adjustment) : 0,
      });
    }

    if (adjustError) {
      console.error('Adjust credits error:', adjustError);
      return res.status(500).json({ error: 'Failed to adjust credits' });
    }

    return res.status(200).json({
      success: true,
      adjustment,
      new_balance: result?.new_balance,
      original_consumed: originalCredits,
      final_consumed: finalCredits,
      refund_applied: adjustment > 0,
      additional_charge: adjustment < 0 ? Math.abs(adjustment) : 0,
    });

  } catch (e: any) {
    console.error('Adjust credits handler error:', e);
    return res.status(500).json({ error: e.message || 'Internal server error' });
  }
}
