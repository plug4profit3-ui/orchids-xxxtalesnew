import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin, requireAuth, addCredits } from '../_supabase.js';

// Generate a unique referral code from name + random suffix
function generateReferralCode(name: string): string {
  const baseName = name
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 6) || 'USER';
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${baseName}-${suffix}`;
}

// GET /api/partners - List active partners
// POST /api/partners - Claim a partner code
// GET /api/partners?type=stats - Get partner stats
// GET /api/partners?type=code - Get user's partner code
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const type = req.query.type as string;

  try {
    // GET: List partners
    if (req.method === 'GET' && type === 'list') {
      const { data: partners, error } = await supabaseAdmin
        .from('partners')
        .select('id, name, code, reward_percentage, logo_url, description, active')
        .eq('active', true)
        .order('reward_percentage', { ascending: false });

      if (error) throw error;
      return res.status(200).json({ partners: partners || [] });
    }

    // GET: Get partner stats
    if (req.method === 'GET' && type === 'stats') {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('partner_code, referral_code')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      const hasPartnerCode = !!profile.partner_code;
      
      // Simulated stats (would be real data in production)
      const stats = {
        clicks: hasPartnerCode ? Math.floor(Math.random() * 500) + 50 : 0,
        signups: hasPartnerCode ? Math.floor(Math.random() * 50) + 5 : 0,
        revenue: hasPartnerCode ? Math.floor(Math.random() * 200) + 20 : 0,
        conversionRate: 0,
        recentSignups: [],
      };

      if (hasPartnerCode) {
        const { data: partner } = await supabaseAdmin
          .from('partners')
          .select('id, reward_percentage')
          .eq('code', profile.partner_code)
          .single();

        if (partner) {
          const { data: signups } = await supabaseAdmin
            .from('partner_signups')
            .select('user_id, created_at')
            .eq('partner_id', partner.id);

          stats.signups = signups?.length || 0;
          stats.revenue = stats.signups * 10;
          stats.recentSignups = signups?.slice(0, 5).map(s => ({
            name: 'New User',
            date: new Date(s.created_at).toLocaleDateString(),
          })) || [];
        }
      }

      return res.status(200).json(stats);
    }

    // GET: Get user's partner code
    if (req.method === 'GET' && type === 'code') {
      const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('partner_code, referral_code')
        .eq('id', userId)
        .single();

      if (error) throw error;

      let code = profile?.partner_code;
      if (!code && profile?.referral_code) {
        code = profile.referral_code;
      } else if (!code) {
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
        const name = userData.user?.user_metadata?.name || userData.user?.email?.split('@')[0] || 'USER';
        code = 'PARTNER-' + generateReferralCode(name).split('-')[1];
      }

      return res.status(200).json({ code });
    }

    // GET: List partners (default)
    if (req.method === 'GET') {
      const { data: partners, error } = await supabaseAdmin
        .from('partners')
        .select('id, name, code, reward_percentage, logo_url, description, active')
        .eq('active', true)
        .order('reward_percentage', { ascending: false });

      if (error) throw error;
      return res.status(200).json({ partners: partners || [] });
    }

    // POST: Claim partner code
    if (req.method === 'POST') {
      const { code } = req.body;
      if (!code) {
        return res.status(400).json({ error: 'Partner code required' });
      }

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

      // Give user bonus credits
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
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Partner API error:', error);
    return res.status(500).json({ error: error.message || 'Failed to process request' });
  }
}