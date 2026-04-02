import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth, logApiUsage, COSTS } from './_supabase.js';
import { LIMITS } from './_rateLimit.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Deepgram API key not configured' });
  }

  // Require auth for TTS
  const userId = await requireAuth(req, res);
  if (!userId) return;

  // Rate limit: 100 TTS/min per user
  if (!LIMITS.tts(userId)) {
    return res.status(429).json({ error: 'Too many requests.' });
  }

  const { text, voice } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }
  const model = voice || 'aura-2-thalia-en';

  try {
    const response = await fetch(
      `https://api.deepgram.com/v1/speak?model=${model}&encoding=mp3`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    // Log TTS usage
    if (userId) {
      const charCount = text.length;
      const costUsd = (charCount / 1000) * COSTS.DEEPGRAM_TTS_PER_K_CHARS;
      logApiUsage(userId, 'deepgram_tts', {
        characters: charCount,
        cost_usd: costUsd,
        metadata: { model, text_length: charCount },
      }).catch(() => {});
    }
    
    res.status(200).json({ audio: base64, contentType: 'audio/mpeg' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
