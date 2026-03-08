// Client-side service for credit balance and consumption API calls
import { getAccessToken } from './supabaseData';

export interface CreditBalance {
  balance: number;
  daily_messages_left: number;
  updated_at?: string;
  transactions?: CreditTransaction[];
}

export interface CreditTransaction {
  id: string;
  type: 'purchase' | 'consumption' | 'refund' | 'expiry' | 'bonus' | 'api_call';
  amount: number;
  description?: string;
  reference_id?: string;
  created_at: string;
}

export interface ConsumeResult {
  success: boolean;
  consumed_credits: number;
  remaining_balance: number;
  insufficient_funds: boolean;
  error?: string;
  vip?: boolean;
}

export interface ConsumeParams {
  estimated_input_tokens?: number;
  estimated_output_tokens?: number;
  message_id?: string;
  idempotency_key?: string;
  intensity?: 'normal' | 'high' | 'extreme';
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

/**
 * Fetch current credit balance and recent transactions from the server.
 */
export async function fetchCreditBalance(): Promise<CreditBalance | null> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/credits-balance', { headers });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Atomically consume credits on the server before a generation.
 * Uses idempotency keys to prevent duplicate charges on retries.
 */
export async function consumeCredits(params: ConsumeParams): Promise<ConsumeResult> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/credits-consume', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });

    const data = await res.json();

    if (res.status === 402) {
      return {
        success: false,
        consumed_credits: 0,
        remaining_balance: data.balance ?? 0,
        insufficient_funds: true,
        error: data.error || 'Insufficient credits',
      };
    }

    if (!res.ok) {
      return {
        success: false,
        consumed_credits: 0,
        remaining_balance: 0,
        insufficient_funds: false,
        error: data.error || 'Failed to consume credits',
      };
    }

    return data as ConsumeResult;
  } catch (err: any) {
    return {
      success: false,
      consumed_credits: 0,
      remaining_balance: 0,
      insufficient_funds: false,
      error: err?.message || 'Network error',
    };
  }
}

/**
 * Estimate the credit cost for a chat message based on text length and intensity.
 * 1 credit ≈ normal message, 5 credits = high intensity, 10 credits = extreme.
 * Add 1 extra credit per ~2000 tokens above baseline.
 *
 * Note: Token estimation uses ~4 chars/token (English baseline). Dutch and other
 * non-English languages may tokenize differently. This is an approximation for
 * pre-charge estimation; actual cost is fixed per message tier (not per token),
 * so minor estimation variance does not affect billing.
 */
export function estimateCreditCost(
  messageText: string,
  intensity: 'normal' | 'high' | 'extreme' = 'normal'
): { cost: number; estimated_input_tokens: number; estimated_output_tokens: number } {
  // Rough token estimate: ~4 chars per token
  const estimated_input_tokens = Math.ceil(messageText.length / 4);
  const estimated_output_tokens = 400; // Typical response length

  let cost = intensity === 'extreme' ? 10 : intensity === 'high' ? 5 : 1;

  const totalTokens = estimated_input_tokens + estimated_output_tokens;
  if (totalTokens > 2000) {
    cost += Math.floor((totalTokens - 2000) / 2000);
  }

  return { cost, estimated_input_tokens, estimated_output_tokens };
}
