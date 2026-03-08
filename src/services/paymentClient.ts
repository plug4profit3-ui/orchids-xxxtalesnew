// Payment client for creating Stripe checkout sessions
import { getAccessToken } from './supabaseData';

export interface CheckoutResult {
  success: boolean;
  plan: string;
  clientSecret?: string;
  type?: 'one_time' | 'subscription';
  credits?: number;
  error?: string;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export const paymentClient = {
  async createCheckout(userId: string, plan: string): Promise<CheckoutResult> {
    try {
      const headers = await getAuthHeaders();
      const productKey = plan.replace('credits_', '').replace('vip_monthly', 'vip');

      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers,
        body: JSON.stringify({ productKey, userId }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, plan, error: data.error || 'Checkout aanmaken mislukt' };
      }

      return {
        success: true,
        plan,
        clientSecret: data.clientSecret,
        type: data.type,
        credits: data.credits,
      };
    } catch (err: any) {
      return { success: false, plan, error: err?.message || 'Netwerk fout' };
    }
  },
};
