-- Partner Revenue Sharing Migration
-- Adds revenue tracking and sharing functionality to the partner system

-- 1. Add revenue tracking columns to partners table
ALTER TABLE partners ADD COLUMN IF NOT EXISTS total_revenue_cents BIGINT DEFAULT 0;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS total_payout_cents BIGINT DEFAULT 0;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS last_payout_date TIMESTAMP WITH TIME ZONE;

-- 2. Add partner revenue tracking to credit_transactions
ALTER TABLE credit_transactions ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES partners(id);
ALTER TABLE credit_transactions ADD COLUMN IF NOT EXISTS partner_commission_cents INTEGER DEFAULT 0;

-- 3. Create partner_payouts table for tracking payments
CREATE TABLE IF NOT EXISTS partner_payouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID REFERENCES partners(id) NOT NULL,
  amount_cents INTEGER NOT NULL,
  transaction_ids UUID[],
  status TEXT DEFAULT 'pending', -- pending, processed, failed
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_credit_transactions_partner ON credit_transactions(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_payouts_partner ON partner_payouts(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_payouts_status ON partner_payouts(status);

-- 5. Create function to calculate partner commission on credit purchases
CREATE OR REPLACE FUNCTION calculate_partner_commission(
  partner_id UUID,
  amount_cents INTEGER
) RETURNS INTEGER AS $$
DECLARE
  commission_cents INTEGER;
  partner_reward_percentage DECIMAL(5,2);
BEGIN
  -- Get partner reward percentage
  SELECT reward_percentage INTO partner_reward_percentage
  FROM partners
  WHERE id = partner_id;
  
  -- Calculate commission (default 10% if not found)
  commission_cents := COALESCE(
    FLOOR(amount_cents * COALESCE(partner_reward_percentage, 10.00) / 100)::INTEGER,
    0
  );
  
  RETURN commission_cents;
END;
$$ LANGUAGE plpgsql;

-- 6. Create function to update partner revenue when credit transaction occurs
CREATE OR REPLACE FUNCTION update_partner_revenue()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process credit purchases (not consumption)
  IF NEW.transaction_type = 'purchase' AND NEW.partner_id IS NOT NULL THEN
    -- Update partner total revenue
    UPDATE partners 
    SET total_revenue_cents = total_revenue_cents + NEW.amount_cents
    WHERE id = NEW.partner_id;
    
    -- Update partner commission
    UPDATE credit_transactions
    SET partner_commission_cents = calculate_partner_commission(NEW.partner_id, NEW.amount_cents)
    WHERE id = NEW.id;
    
    -- Update partner total payout amount
    UPDATE partners 
    SET total_payout_cents = total_payout_cents + calculate_partner_commission(NEW.partner_id, NEW.amount_cents)
    WHERE id = NEW.partner_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger to automatically update partner revenue
DROP TRIGGER IF EXISTS update_partner_revenue_trigger ON credit_transactions;
CREATE TRIGGER update_partner_revenue_trigger
  AFTER INSERT ON credit_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_partner_revenue();

-- 8. Add partner dashboard view
CREATE OR REPLACE VIEW partner_dashboard AS
SELECT 
  p.id,
  p.name,
  p.code,
  p.reward_percentage,
  p.total_revenue_cents,
  p.total_payout_cents,
  COALESCE(p.total_revenue_cents, 0) - COALESCE(p.total_payout_cents, 0) AS pending_payout_cents,
  p.last_payout_date,
  COUNT(ps.id) AS total_signups,
  COUNT(ct.id) FILTER (WHERE ct.transaction_type = 'purchase') AS total_purchases,
  SUM(ct.amount_cents) FILTER (WHERE ct.transaction_type = 'purchase') AS total_purchase_value_cents
FROM partners p
LEFT JOIN partner_signups ps ON p.id = ps.partner_id
LEFT JOIN profiles pr ON ps.user_id = pr.id
LEFT JOIN credit_transactions ct ON pr.id = ct.user_id AND ct.partner_id = p.id
GROUP BY p.id, p.name, p.code, p.reward_percentage, p.total_revenue_cents, p.total_payout_cents, p.last_payout_date;
