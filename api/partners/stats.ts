import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin, requireAuth } from './_supabase';

// GET /api/partners/stats - Get partner stats for current user
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = await requireAuth(req, res);
  if (!userId) return;

  try {
    // Get user's partner code from profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('partner_code, referral_code')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // For demo purposes, simulate stats if no real partner code
    // In production, this would count real partner signups
    const hasPartnerCode = !!profile.partner_code;
    const hasReferralCode = !!profile.referral_code;

    // Simulated stats (would be real data in production)
    const stats = {
      clicks: hasPartnerCode ? Math.floor(Math.random() * 500) + 50 : 0,
      signups: hasPartnerCode ? Math.floor(Math.random() * 50) + 5 : 0,
      revenue: hasPartnerCode ? Math.floor(Math.random() * 200) + 20 : 0,
      conversionRate: 0,
      recentSignups: [],
    };

    // If user has a partner code, fetch real stats from partner_signups
    if (hasPartnerCode) {
      // Find the partner
      const { data: partner } = await supabaseAdmin
        .from('partners')
        .select('id, reward_percentage')
        .eq('code', profile.partner_code)
        .single();

      if (partner) {
        // Get signups for this partner
        const { data: signups } = await supabaseAdmin
          .from('partner_signups')
          .select('user_id, created_at')
          .eq('partner_id', partner.id);

        stats.signups = signups?.length || 0;
        stats.revenue = stats.signups * 10; // Simulated: €10 per signup
        stats.recentSignups = signups?.slice(0, 5).map(s => ({
          name: 'New User',
          date: new Date(s.created_at).toLocaleDateString(),
        })) || [];
      }
    }

    return res.status(200).json(stats);
  } catch (error: any) {
    console.error('Failed to get partner stats:', error);
    return res.status(500).json({ error: 'Failed to get partner stats' });
  }
}