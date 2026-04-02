import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin, requireAuth } from './_supabase';

// GET /api/partners/list - List active partners
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data: partners, error } = await supabaseAdmin
      .from('partners')
      .select('id, name, code, reward_percentage, logo_url, description, active')
      .eq('active', true)
      .order('reward_percentage', { ascending: false });

    if (error) throw error;

    return res.status(200).json({ partners: partners || [] });
  } catch (error: any) {
    console.error('Failed to fetch partners:', error);
    return res.status(500).json({ error: 'Failed to fetch partners' });
  }
}