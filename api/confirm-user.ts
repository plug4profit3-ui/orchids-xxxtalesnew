// Create or sign-in a user via Supabase Admin API (bypasses email rate limits)
import { supabaseAdmin } from './_supabase.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password, name, action } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return res.status(500).json({ error: 'Missing Supabase config' });

  const headers = {
    'Authorization': `Bearer ${serviceRoleKey}`,
    'apikey': serviceRoleKey,
    'Content-Type': 'application/json',
  };

  if (action === 'register') {
    // Step 1: Create user via admin API with password
    const createResp = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { name: name || email.split('@')[0] },
      }),
    });

    if (!createResp.ok) {
      const err = await createResp.json().catch(() => ({ msg: 'Unknown error' }));
      if (err.msg?.includes('already been registered') || err.msg?.includes('already exists')) {
        return res.status(409).json({ error: 'Er bestaat al een account met dit e-mailadres. Probeer in te loggen.' });
      }
      return res.status(createResp.status).json({ error: err.msg || 'Registration failed' });
    }

    const userData = await createResp.json();
    const userId = userData.id;

    // Step 2: Force-update the password via admin API (ensures correct hash)
    await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ password }),
    });

    // Step 3: Create profile and credit account
    await supabaseAdmin.from('profiles').upsert({
      id: userId,
      name: name || email.split('@')[0],
      email,
    });

    await supabaseAdmin.from('credit_accounts').upsert({
      user_id: userId,
      balance: 50,
      daily_messages_left: 10,
    });

    await supabaseAdmin.from('credit_transactions').insert({
      user_id: userId,
      amount: 50,
      type: 'signup_bonus',
      metadata: { source: 'registration' },
    });

    // Step 4: Login to get session
    const tokenResp = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': process.env.VITE_SUPABASE_ANON_KEY || serviceRoleKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!tokenResp.ok) {
      // Return user without session - frontend will handle login
      return res.status(200).json({ user: userData, session: null });
    }

    const session = await tokenResp.json();
    return res.status(200).json({ user: userData, session });
  }

  // Default: login
  const tokenResp = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'apikey': process.env.VITE_SUPABASE_ANON_KEY || serviceRoleKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!tokenResp.ok) {
    return res.status(401).json({ error: 'Onjuist e-mailadres of wachtwoord' });
  }

  const session = await tokenResp.json();
  const userId = session.user?.id;

  // Ensure profile and credit account exist for existing users
  if (userId) {
    await supabaseAdmin.from('profiles').upsert({
      id: userId,
      name: session.user?.user_metadata?.name || email.split('@')[0],
      email,
    }, { onConflict: 'id', ignoreDuplicates: true });

    await supabaseAdmin.from('credit_accounts').upsert({
      user_id: userId,
    }, { onConflict: 'user_id', ignoreDuplicates: true });

    // Reset daily messages if needed
    const today = new Date().toISOString().split('T')[0];
    const { data: account } = await supabaseAdmin
      .from('credit_accounts')
      .select('daily_reset_at')
      .eq('user_id', userId)
      .single();

    if (account && account.daily_reset_at !== today) {
      await supabaseAdmin
        .from('credit_accounts')
        .update({ daily_messages_left: 10, daily_reset_at: today })
        .eq('user_id', userId);
    }
  }

  return res.status(200).json({ session });
}
