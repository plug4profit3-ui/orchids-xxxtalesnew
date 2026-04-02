import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireCredits, logApiUsage, COSTS } from './_supabase.js';
import { LIMITS } from './_rateLimit.js';

const VENICE_API_URL = "https://api.venice.ai/api/v1";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.VENICE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Require auth + 5 credits per image (server enforced)
  const userId = await requireCredits(req, res, 5);
  if (!userId) return; // 401 or 402 already sent

  // Rate limit: 20 images/min per user
  if (!LIMITS.image(userId)) {
    return res.status(429).json({ error: 'Too many requests. Please slow down.' });
  }

  // Models to try in order — fallback if primary is at capacity
  const MODELS = [req.body?.model || 'lustify-v7', 'lustify-sdxl', 'venice-sd35'];
  const uniqueModels = [...new Set(MODELS)];

  let data: any = null;
  let lastError: string = 'Unknown error';

  for (const model of uniqueModels) {
    try {
      const response = await fetch(`${VENICE_API_URL}/image/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ ...req.body, model }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        // If at capacity, try next model
        if (response.status === 503 || response.status === 500 || errorText.toLowerCase().includes('capacity')) {
          lastError = errorText;
          continue;
        }
        return res.status(response.status).json({ error: errorText });
      }

      data = await response.json();
      break; // success
    } catch (fetchErr: any) {
      lastError = fetchErr.message;
      continue;
    }
  }

  if (!data) {
    return res.status(503).json({ error: lastError });
  }

  try {

    // Log image generation usage
    if (userId) {
      logApiUsage(userId, 'venice_image', {
        cost_usd: COSTS.VENICE_IMAGE,
        metadata: { model: req.body?.model || 'lustify-sdxl', prompt: req.body?.prompt?.substring(0, 200) },
      }).catch(() => {});
    }

    return res.status(200).json(data);
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Internal server error' });
  }
}
