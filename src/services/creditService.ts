// Credit Service - API integration for credit management
import { supabase } from './supabase';

// Types
export interface CreditBalance {
  user_id: string;
  balance: number;
  daily_messages_left: number;
  last_updated: string;
  is_premium: boolean;
  vip_expires_at?: string;
  trial_used?: boolean;
  streak?: number;
  last_login_date?: string;
  days_until_expiry?: number | null;
}

export interface CreditTransaction {
  id: string;
  type: 'purchase' | 'consumption' | 'refund' | 'bonus' | 'adjustment';
  amount: number;
  description: string;
  reference_type?: string;
  reference_id?: string;
  estimated_tokens?: number;
  actual_tokens?: number;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface CreditPackage {
  id: string;
  name: string;
  credits_amount: number;
  price_eur: number;
  price_display: string;
  description: string;
  stripe_price_id?: string;
  estimated_messages: number;
}

export interface ConsumeResponse {
  success: boolean;
  consumed_credits: number;
  remaining_balance: number;
  insufficient_funds: boolean;
  request_id: string;
  estimated_cost: {
    input_tokens: number;
    output_tokens: number;
    credits: number;
  };
  error?: string;
  message?: string;
}

export interface AdjustResponse {
  success: boolean;
  adjustment: number;
  new_balance: number;
  original_consumed: number;
  final_consumed: number;
  refund_applied?: boolean;
  additional_charge?: number;
}

// Get access token from Supabase
async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

// Make authenticated API request
async function apiRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  body?: Record<string, any>
): Promise<T> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(endpoint, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// Get current credit balance
export async function getCreditBalance(): Promise<CreditBalance> {
  return apiRequest<CreditBalance>('/api/credits/balance');
}

// Get transaction history
export async function getTransactions(
  limit: number = 20,
  offset: number = 0,
  type?: string
): Promise<{
  transactions: CreditTransaction[];
  total: number;
  has_more: boolean;
  pagination: {
    limit: number;
    offset: number;
    next_offset: number | null;
  };
}> {
  const params = new URLSearchParams();
  params.set('limit', String(limit));
  params.set('offset', String(offset));
  if (type) params.set('type', type);
  
  return apiRequest(`/api/credits/transactions?${params.toString()}`);
}

// Get available credit packages
export async function getCreditPackages(): Promise<{ packages: CreditPackage[] }> {
  const response = await fetch('/api/credits/packages');
  if (!response.ok) {
    throw new Error('Failed to fetch packages');
  }
  return response.json();
}

// Consume credits before API call
export async function consumeCredits(params: {
  estimated_input_tokens: number;
  estimated_output_tokens: number;
  message_id?: string;
  request_id?: string;
  intensity?: 'normal' | 'high' | 'extreme';
  service_type?: 'chat' | 'image' | 'tts';
}): Promise<ConsumeResponse> {
  return apiRequest<ConsumeResponse>('/api/credits/consume', 'POST', params);
}

// Adjust credits after actual API usage
export async function adjustCredits(params: {
  request_id: string;
  actual_input_tokens: number;
  actual_output_tokens: number;
  message_id?: string;
  intensity?: 'normal' | 'high' | 'extreme';
}): Promise<AdjustResponse> {
  return apiRequest<AdjustResponse>('/api/credits/adjust', 'POST', params);
}

// Refund credits for a failed API call
export async function refundCredits(params: {
  request_id: string;
  reason?: string;
}): Promise<{ success: boolean; refunded: number; new_balance: number }> {
  return apiRequest('/api/credits/refund', 'POST', params);
}

// Subscribe to real-time balance updates
export function subscribeToBalanceChanges(
  userId: string,
  callback: (balance: CreditBalance) => void
): { unsubscribe: () => void } {
  const subscription = supabase
    .channel('credit_balance_changes')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'credit_accounts',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        callback({
          user_id: userId,
          balance: payload.new.balance,
          daily_messages_left: payload.new.daily_messages_left,
          last_updated: payload.new.updated_at,
          is_premium: payload.new.is_premium || false,
        } as CreditBalance);
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      subscription.unsubscribe();
    },
  };
}

// Calculate estimated cost for UI display
export function calculateEstimatedCost(
  inputTokens: number,
  outputTokens: number,
  intensity: 'normal' | 'high' | 'extreme' = 'normal'
): number {
  const baseCosts = {
    normal: 1,
    high: 5,
    extreme: 10,
  };
  
  const baseCost = baseCosts[intensity] || baseCosts.normal;
  const totalTokens = inputTokens + outputTokens;
  
  let tokenCost = 0;
  if (totalTokens > 2000) {
    const excessTokens = totalTokens - 2000;
    tokenCost = (excessTokens / 1000) * 0.5;
  }
  
  return Math.max(0.1, Math.round((baseCost + tokenCost) * 100) / 100);
}

// Format credits for display
export function formatCredits(credits: number): string {
  if (credits >= 1000) {
    return `${(credits / 1000).toFixed(1)}k`;
  }
  return credits.toFixed(credits % 1 === 0 ? 0 : 1);
}

// Check if balance is low
export function isLowBalance(balance: number): boolean {
  return balance < 10;
}

// Check if balance is critical
export function isCriticalBalance(balance: number): boolean {
  return balance < 5;
}
