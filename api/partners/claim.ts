import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin, requireAuth, addCredits } from './_supabase';

// POST /api/partners/claim - Claim a partner code
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = await requireAuth(req, res);
  if (!userId) return;

  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Partner code required' });
  }

  try {
    // Find the partner by code
    const { data: partner, error: partnerError } = await supabaseAdmin
      .from('partners')
      .select('id, name, code, reward_percentage')
      .eq('code', code.toUpperCase())
      .eq('active', true)
      .single();

    if (partnerError || !partner) {
      return res.status(404).json({ error: 'Invalid or inactive partner code' });
    }

    // Check if user already claimed a partner code
    const { data: existingClaim } = await supabaseAdmin
      .from('profiles')
      .select('partner_code')
      .eq('id', userId)
      .single();

    if (existingClaim?.partner_code) {
      return res.status(400).json({ error: 'You have already claimed a partner code' });
    }

    // Update user's partner_code
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ partner_code: partner.code })
      .eq('id', userId);

    if (updateError) throw updateError;

    // Record the partner signup
    await supabaseAdmin.from('partner_signups').insert({
      partner_id: partner.id,
      user_id: userId,
    });

    // Give user bonus credits (e.g., 10 credits for using partner code)
    const bonusCredits = 10;
    const newBalance = await addCredits(userId, bonusCredits, 'partner_bonus', { partner_code: partner.code });

    return res.status(200).json({
      success: true,
      partner: {
        name: partner.name,
        code: partner.code,
      },
      bonusCredits,
      newBalance,
    });
  } catch (error: any) {
    console.error('Failed to claim partner code:', error);
    return res.status(500).json({ error: 'Failed to claim partner code' });
  }
}