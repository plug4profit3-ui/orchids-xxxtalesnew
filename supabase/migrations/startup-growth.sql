-- Database migration for startup growth features
-- Run these in Supabase SQL editor

-- 1. Create partners table
CREATE TABLE IF NOT EXISTS partners (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  reward_percentage decimal(5,2) DEFAULT 10.00,
  logo_url text,
  description text,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- 2. Add referral columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_count integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS partner_code text;

-- 3. Create partner_signups table for tracking
CREATE TABLE IF NOT EXISTS partner_signups (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id uuid REFERENCES partners(id),
  user_id uuid REFERENCES profiles(id),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(partner_id, user_id)
);

-- 4. Seed some demo partners
INSERT INTO partners (name, code, reward_percentage, logo_url, description, active) VALUES
  ('SexyShop', 'SEXYSHOPS', 15.00, 'https://storage.googleapis.com/foto1982/logo.jpeg', 'Dé online seksshop van Nederland', true),
  ('EasyToys', 'EASYTOYS', 12.00, 'https://storage.googleapis.com/foto1982/logo.jpeg', 'Discreet speelgoed en accessories', true),
  ('Venus', 'VENUS4U', 10.00, 'https://storage.googleapis.com/foto1982/logo.jpeg', 'Premium seksuele gezondheid', true),
  ('Sekskamers', 'SEKSKAMERS', 8.00, 'https://storage.googleapis.com/foto1982/logo.jpeg', 'Erotische producten', true)
ON CONFLICT (code) DO NOTHING;