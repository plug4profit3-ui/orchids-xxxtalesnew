import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserIdFromAuth, logApiUsage, COSTS } from './_supabase';

const VENICE_API_URL = "https://api.venice.ai/api/v1";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.VENICE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const userId = await getUserIdFromAuth(req.headers.authorization);

  try {
    const response = await fetch(`${VENICE_API_URL}/image/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();

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
