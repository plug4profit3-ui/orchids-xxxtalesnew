import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin, requireAuth, getUserIdFromAuth, logApiUsage, COSTS, CREDIT_COSTS, deductCredits } from './_supabase';
import { LIMITS } from './_rateLimit';

const VENICE_API_URL = "https://api.venice.ai/api/v1";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.VENICE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Require valid auth on all chat requests
  const userId = await requireAuth(req, res);
  if (!userId) return; // 401 already sent

  // Rate limit: 60 messages/min per user
  if (!LIMITS.chat(userId)) {
    return res.status(429).json({ error: 'Too many requests. Please slow down.' });
  }

  // --- CREDIT CHECK ---
  // Check if user is VIP (unlimited usage)
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('is_premium, vip_expires_at')
    .eq('id', userId)
    .single();

  const isVip =
    profile?.is_premium &&
    (!profile.vip_expires_at || new Date(profile.vip_expires_at) > new Date());

  if (!isVip) {
    // Determine cost based on intensity passed in request
    const intensity = req.body?.intensity || 'normal';
    let creditCost = CREDIT_COSTS.CHAT_NORMAL;
    if (intensity === 'high') creditCost = CREDIT_COSTS.CHAT_HIGH;
    if (intensity === 'extreme') creditCost = CREDIT_COSTS.CHAT_EXTREME;

    const idempotencyKey = req.body?.idempotency_key || null;

    // Quick balance pre-check (avoid lock contention on obvious failures)
    const { data: account } = await supabaseAdmin
      .from('credit_accounts')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (!account || Number(account.balance) < creditCost) {
      return res.status(402).json({
        error: 'Insufficient credits',
        balance: Number(account?.balance ?? 0),
        required: creditCost,
      });
    }

    // Atomic deduction before calling AI
    const messageId = req.body?.message_id || null;
    const { success, newBalance } = await deductCredits(
      userId,
      creditCost,
      'consumption',
      {
        description: `Chat message${messageId ? ` ${messageId}` : ''} – intensity: ${intensity}`,
        reference_id: messageId,
        intensity,
      },
      idempotencyKey
    );

    if (!success) {
      return res.status(402).json({ error: 'Insufficient credits', balance: newBalance });
    }
  }
  // --------------------

  const isStream = req.body?.stream === true;

  try {
    // Strip internal credit-system fields before forwarding to Venice
    const veniceBody = { ...req.body };
    delete veniceBody.intensity;
    delete veniceBody.idempotency_key;
    delete veniceBody.message_id;

    const response = await fetch(`${VENICE_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(veniceBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }

    if (isStream && response.body) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const reader = (response.body as any).getReader();
      const decoder = new TextDecoder();
      let totalTokensIn = 0;
      let totalTokensOut = 0;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          res.write(chunk);

          // Try to extract usage from the final chunk
          if (chunk.includes('"usage"')) {
            try {
              const lines = chunk.split('\n');
              for (const line of lines) {
                if (line.startsWith('data: ') && line.includes('"usage"')) {
                  const data = JSON.parse(line.slice(6));
                  if (data.usage) {
                    totalTokensIn = data.usage.prompt_tokens || 0;
                    totalTokensOut = data.usage.completion_tokens || 0;
                  }
                }
              }
            } catch {}
          }
        }
      } catch {}

      // Log usage after stream completes
      if (userId && (totalTokensIn > 0 || totalTokensOut > 0)) {
        const costUsd = (totalTokensIn * COSTS.VENICE_CHAT_INPUT_PER_M + totalTokensOut * COSTS.VENICE_CHAT_OUTPUT_PER_M) / 1_000_000;
        logApiUsage(userId, 'venice_chat', {
          tokens_in: totalTokensIn,
          tokens_out: totalTokensOut,
          cost_usd: costUsd,
          metadata: { model: req.body?.model || 'deepseek-v3.2', stream: true },
        }).catch(() => {});
      }

      res.end();
      return;
    }

    const data = await response.json();

    // Log usage for non-stream requests
    if (userId && data.usage) {
      const tokensIn = data.usage.prompt_tokens || 0;
      const tokensOut = data.usage.completion_tokens || 0;
      const costUsd = (tokensIn * COSTS.VENICE_CHAT_INPUT_PER_M + tokensOut * COSTS.VENICE_CHAT_OUTPUT_PER_M) / 1_000_000;
      logApiUsage(userId, 'venice_chat', {
        tokens_in: tokensIn,
        tokens_out: tokensOut,
        cost_usd: costUsd,
        metadata: { model: req.body?.model || 'deepseek-v3.2' },
      }).catch(() => {});
    }

    return res.status(200).json(data);
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Internal server error' });
  }
}
