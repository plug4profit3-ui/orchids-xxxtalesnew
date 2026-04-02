import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin, requireAuth, addCredits } from './_supabase';

// Generate a unique referral code from name + random suffix
function generateReferralCode(name: string): string {
  const baseName = name
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 6) || 'USER';
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${baseName}-${suffix}`;
}

// GET /api/referrals/code - Get user's referral code
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = await requireAuth(req, res);
  if (!userId) return;

  try {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('referral_code, referral_count')
      .eq('id', userId)
      .single();

    if (error) throw error;

    // Generate code if doesn't exist
    let code = profile?.referral_code;
    if (!code) {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
      const name = userData.user?.user_metadata?.name || userData.user?.email?.split('@')[0] || 'USER';
      code = generateReferralCode(name);
      
      await supabaseAdmin
        .from('profiles')
        .update({ referral_code: code })
        .eq('id', userId);
    }

    return res.status(200).json({
      code,
      referralCount: profile?.referral_count || 0,
    });
  } catch (error: any) {
    console.error('Failed to get referral code:', error);
    return res.status(500).json({ error: 'Failed to get referral code' });
  }
}