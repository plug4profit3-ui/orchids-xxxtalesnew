import type { VercelRequest, VercelResponse } from '@vercel/node';

import { supabaseAdmin, requireAuth } from './_supabase.js';

// Only admin can trigger generation (protect expensive ElevenLabs music API)
const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS || '').split(',').filter(Boolean);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ElevenLabs API key not configured' });
  }

  const userId = await requireAuth(req, res);
  if (!userId) return;

  // Only admins can generate new tracks (expensive operation)
  if (ADMIN_USER_IDS.length > 0 && !ADMIN_USER_IDS.includes(userId)) {
    return res.status(403).json({ error: 'Admin only' });
  }

  const { mood } = req.body;
  if (!mood) {
    return res.status(400).json({ error: 'mood is required' });
  }

  // Get track config from DB
  const { data: track, error: trackErr } = await supabaseAdmin
    .from('music_tracks')
    .select('*')
    .eq('mood', mood)
    .single();

  if (trackErr || !track) {
    return res.status(404).json({ error: 'Track mood not found' });
  }

  try {
    // Call ElevenLabs Sound Generation API (30s ambient track)
    const response = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text: track.prompt,
        duration_seconds: 30,
        prompt_influence: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }

    const audioBuffer = await response.arrayBuffer();
    const fileName = `${mood}.mp3`;

    // Upload to Supabase Storage
    const { error: uploadErr } = await supabaseAdmin.storage
      .from('music-tracks')
      .upload(fileName, Buffer.from(audioBuffer), {
        contentType: 'audio/mpeg',
        upsert: true,
      });

    if (uploadErr) {
      return res.status(500).json({ error: 'Upload failed: ' + uploadErr.message });
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('music-tracks')
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    // Update track record with URL
    await supabaseAdmin
      .from('music_tracks')
      .update({
        storage_path: fileName,
        public_url: publicUrl,
        generated_at: new Date().toISOString(),
      })
      .eq('mood', mood);

    return res.status(200).json({ success: true, url: publicUrl, mood });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}