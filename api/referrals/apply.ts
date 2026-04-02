import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin, requireAuth, addCredits } from './_supabase';

// POST /api/referrals/apply - Apply a referral code during signup
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = await requireAuth(req, res);
  if (!userId) return;

  const { referralCode } = req.body;
  if (!referralCode) {
    return res.status(400).json({ error: 'Referral code required' });
  }

  try {
    // Find the referrer by referral code
    const { data: referrer, error: referrerError } = await supabaseAdmin
      .from('profiles')
      .select('id, name, referral_count')
      .eq('referral_code', referralCode.toUpperCase())
      .single();

    if (referrerError || !referrer) {
      return res.status(404).json({ error: 'Invalid referral code' });
    }

    // Check if user was already referred
    const { data: currentProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('referred_by')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    if (currentProfile?.referred_by) {
      return res.status(400).json({ error: 'You have already used a referral code' });
    }

    // Prevent self-referral
    if (referrer.id === userId) {
      return res.status(400).json({ error: 'Cannot use your own referral code' });
    }

    // Update user's referred_by
    await supabaseAdmin
      .from('profiles')
      .update({ referred_by: referralCode.toUpperCase() })
      .eq('id', userId);

    // Give referrer +50 credits
    const referrerNewBalance = await addCredits(
      referrer.id,
      50,
      'referral_bonus',
      { referred_user_id: userId }
    );

    // Give new user +25 credits welcome bonus
    const newUserBalance = await addCredits(
      userId,
      25,
      'referral_signup_bonus',
      { referred_by: referralCode.toUpperCase() }
    );

    // Increment referrer's referral count
    await supabaseAdmin
      .from('profiles')
      .update({ referral_count: (referrer.referral_count || 0) + 1 })
      .eq('id', referrer.id);

    return res.status(200).json({
      success: true,
      referredBy: referralCode.toUpperCase(),
      bonusCredits: 25,
      newBalance: newUserBalance,
      referrerBonus: 50,
      referrerNewBalance: referrerNewBalance,
    });
  } catch (error: any) {
    console.error('Failed to apply referral code:', error);
    return res.status(500).json({ error: 'Failed to apply referral code' });
  }
}