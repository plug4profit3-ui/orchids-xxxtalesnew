import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin, requireAuth, COSTS } from '../_supabase.js';

/**
 * POST /api/credits/consume
 * 
 * Consumes credits atomically before making an API call.
 * Supports idempotent requests via request_id.
 * 
 * Request body:
 * {
 *   user_id: string (optional, derived from auth if not provided),
 *   estimated_input_tokens: number,
 *   estimated_output_tokens: number,
 *   message_id: string (optional),
 *   request_id: string (optional, for idempotency),
 *   intensity: 'normal' | 'high' | 'extreme' (optional, affects cost)
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   consumed_credits: number,
 *   remaining_balance: number,
 *   insufficient_funds: boolean
 * }
 */

// Credit cost configuration
const CREDIT_COSTS = {
  // Base costs per intensity level
  BASE: {
    normal: 1,
    high: 5,
    extreme: 10,
  },
  // Token-based costs (credits per 1000 tokens)
  TOKENS_PER_1K: 0.5,
  // Minimum cost
  MINIMUM: 0.1,
  // Image generation cost
  IMAGE: 5,
  // TTS cost per 1000 characters
  TTS_PER_1K_CHARS: 0.3,
};

/**
 * Calculate credits based on tokens
 * 1 credit ≈ 1000-2000 tokens (hybrid model)
 * Base cost + variable cost for large contexts
 */
function calculateCredits(
  inputTokens: number,
  outputTokens: number,
  intensity: 'normal' | 'high' | 'extreme' = 'normal'
): number {
  // Base cost based on intensity
  const baseCost = CREDIT_COSTS.BASE[intensity] || CREDIT_COSTS.BASE.normal;
  
  // Token-based variable cost (only for large contexts)
  const totalTokens = inputTokens + outputTokens;
  let tokenCost = 0;
  
  if (totalTokens > 2000) {
    // Additional cost for large contexts
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
      estimated_input_tokens = 0,
      estimated_output_tokens = 0,
      message_id,
      request_id,
      intensity = 'normal',
      service_type = 'chat', // 'chat', 'image', 'tts'
    } = req.body || {};

    // Validate inputs
    if (estimated_input_tokens < 0 || estimated_output_tokens < 0) {
      return res.status(400).json({ error: 'Invalid token counts' });
    }

    // Calculate credits to consume based on service type
    let creditsToConsume: number;
    let description: string;

    switch (service_type) {
      case 'image':
        creditsToConsume = CREDIT_COSTS.IMAGE;
        description = `Image generation${message_id ? ` #${message_id}` : ''}`;
        break;
      
      case 'tts':
        const charCount = estimated_input_tokens; // For TTS, input_tokens represents character count
        creditsToConsume = Math.max(
          CREDIT_COSTS.MINIMUM,
          Math.round((charCount / 1000) * CREDIT_COSTS.TTS_PER_1K_CHARS * 100) / 100
        );
        description = `Text-to-speech (${charCount} chars)`;
        break;
      
      case 'chat':
      default:
        creditsToConsume = calculateCredits(
          estimated_input_tokens,
          estimated_output_tokens,
          intensity
        );
        description = `Chat message${message_id ? ` #${message_id}` : ''} - ${intensity} intensity`;
        break;
    }

    // Generate request_id if not provided (for idempotency)
    const effectiveRequestId = request_id || `${userId}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

    // Call the database function to atomically consume credits
    const { data: result, error } = await supabaseAdmin.rpc('consume_credits',
      {
        p_user_id: userId,
        p_amount: creditsToConsume,
        p_request_id: effectiveRequestId,
        p_type: 'consumption',
        p_description: description,
        p_reference_type: service_type,
        p_reference_id: message_id || null,
        p_estimated_tokens: estimated_input_tokens + estimated_output_tokens,
        p_actual_tokens: null, // Will be updated after actual API call
      }
    );

    if (error) {
      console.error('Consume credits error:', error);
      return res.status(500).json({ error: 'Failed to consume credits' });
    }

    const { success, new_balance, insufficient_funds } = result[0];

    if (insufficient_funds) {
      return res.status(402).json({
        success: false,
        consumed_credits: 0,
        remaining_balance: new_balance,
        insufficient_funds: true,
        error: 'Insufficient credits',
        message: `Je hebt ${creditsToConsume} credits nodig maar je hebt er maar ${new_balance}. Koop meer credits om door te gaan.`,
      });
    }

    if (!success) {
      return res.status(500).json({
        success: false,
        consumed_credits: 0,
        remaining_balance: new_balance,
        insufficient_funds: false,
        error: 'Failed to consume credits',
      });
    }

    // Return success response
    return res.status(200).json({
      success: true,
      consumed_credits: creditsToConsume,
      remaining_balance: new_balance,
      insufficient_funds: false,
      request_id: effectiveRequestId,
      estimated_cost: {
        input_tokens: estimated_input_tokens,
        output_tokens: estimated_output_tokens,
        credits: creditsToConsume,
      },
    });

  } catch (e: any) {
    console.error('Consume credits handler error:', e);
    return res.status(500).json({
      error: e.message || 'Internal server error',
    });
  }
}
