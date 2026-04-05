-- Credit System Migration
-- Creates tables for credit-based usage system with real-time API accounting

-- Credit packages for purchase
CREATE TABLE IF NOT EXISTS credit_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    credits_amount DECIMAL(10, 2) NOT NULL,
    price_eur INTEGER NOT NULL, -- stored in cents (e.g., 499 = €4.99)
    stripe_price_id VARCHAR(255),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    is_micro_transaction BOOLEAN DEFAULT false,
    is_first_purchase_discount BOOLEAN DEFAULT false,
    discount_percentage INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_credit_packages_active ON credit_packages(is_active);

-- Insert default credit packages
INSERT INTO credit_packages (name, credits_amount, price_eur, description, sort_order, is_micro_transaction) VALUES
    ('Micro', 25, 199, 'Quick start - probeer het uit', 0, true),
    ('Starter', 80, 499, 'Perfect voor beginners - ongeveer 80 berichten', 1, false),
    ('Populair', 250, 999, 'Meest gekozen - ongeveer 250 berichten', 2, false),
    ('Intens', 600, 1999, 'Voor de fanatieke chatter - ongeveer 600 berichten', 3, false),
    ('Elite', 1500, 3999, 'Ultieme ervaring - ongeveer 1500 berichten', 4, false)
ON CONFLICT DO NOTHING;

-- Insert first purchase discount packages
INSERT INTO credit_packages (name, credits_amount, price_eur, description, sort_order, is_first_purchase_discount, discount_percentage) VALUES
    ('Starter - Eerste Koop', 80, 399, '20% korting op je eerste aankoop!', 5, true, 20),
    ('Populair - Eerste Koop', 250, 799, '20% korting op je eerste aankoop!', 6, true, 20),
    ('Intens - Eerste Koop', 600, 1599, '20% korting op je eerste aankoop!', 7, true, 20),
    ('Elite - Eerste Koop', 1500, 3199, '20% korting op je eerste aankoop!', 8, true, 20)
ON CONFLICT DO NOTHING;

-- Insert bundle deal packages
INSERT INTO credit_packages (name, credits_amount, price_eur, description, sort_order) VALUES
    ('Weekend Warrior', 150, 799, 'Speciaal weekendpakket - 150 credits voor €7.99', 9),
    ('Night Owl', 300, 1299, 'Avondpakket - 300 credits voor €12.99', 10)
ON CONFLICT DO NOTHING;

-- Add expiry tracking to credit_accounts
ALTER TABLE credit_accounts 
ADD COLUMN IF NOT EXISTS total_purchased_credits DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_consumed_credits DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_purchase_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS low_balance_notified_at TIMESTAMPTZ;

-- Enhance credit_transactions with more metadata
ALTER TABLE credit_transactions
ADD COLUMN IF NOT EXISTS request_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS estimated_tokens INTEGER,
ADD COLUMN IF NOT EXISTS actual_tokens INTEGER,
ADD COLUMN IF NOT EXISTS reference_type VARCHAR(50), -- 'chat_message', 'image_generation', 'tts', 'purchase', etc.
ADD COLUMN IF NOT EXISTS reference_id UUID;

-- Create index for idempotency checks
CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_transactions_request_id 
ON credit_transactions(request_id) 
WHERE request_id IS NOT NULL;

-- Create index for transaction lookups by reference
CREATE INDEX IF NOT EXISTS idx_credit_transactions_reference 
ON credit_transactions(reference_type, reference_id) 
WHERE reference_type IS NOT NULL;

-- Create function to atomically consume credits with idempotency check
CREATE OR REPLACE FUNCTION consume_credits(
    p_user_id UUID,
    p_amount DECIMAL,
    p_request_id VARCHAR,
    p_type VARCHAR,
    p_description TEXT,
    p_reference_type VARCHAR DEFAULT NULL,
    p_reference_id UUID DEFAULT NULL,
    p_estimated_tokens INTEGER DEFAULT NULL,
    p_actual_tokens INTEGER DEFAULT NULL
)
RETURNS TABLE (
    success BOOLEAN,
    new_balance DECIMAL,
    insufficient_funds BOOLEAN
) AS $$
DECLARE
    v_current_balance DECIMAL;
    v_existing_transaction UUID;
BEGIN
    -- Check for existing transaction (idempotency)
    IF p_request_id IS NOT NULL THEN
        SELECT id INTO v_existing_transaction
        FROM credit_transactions
        WHERE request_id = p_request_id;
        
        IF v_existing_transaction IS NOT NULL THEN
            -- Return current balance without deducting again
            SELECT balance INTO v_current_balance
            FROM credit_accounts
            WHERE user_id = p_user_id;
            
            RETURN QUERY SELECT TRUE, v_current_balance, FALSE;
            RETURN;
        END IF;
    END IF;
    
    -- Get current balance with row lock
    SELECT balance INTO v_current_balance
    FROM credit_accounts
    WHERE user_id = p_user_id
    FOR UPDATE;
    
    -- Check if user exists
    IF v_current_balance IS NULL THEN
        RETURN QUERY SELECT FALSE, 0::DECIMAL, TRUE;
        RETURN;
    END IF;
    
    -- Check sufficient funds
    IF v_current_balance < p_amount THEN
        RETURN QUERY SELECT FALSE, v_current_balance, TRUE;
        RETURN;
    END IF;
    
    -- Deduct credits
    UPDATE credit_accounts
    SET 
        balance = balance - p_amount,
        total_consumed_credits = total_consumed_credits + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Log transaction
    INSERT INTO credit_transactions (
        user_id,
        amount,
        type,
        description,
        request_id,
        reference_type,
        reference_id,
        estimated_tokens,
        actual_tokens,
        metadata
    ) VALUES (
        p_user_id,
        -p_amount,
        p_type,
        p_description,
        p_request_id,
        p_reference_type,
        p_reference_id,
        p_estimated_tokens,
        p_actual_tokens,
        jsonb_build_object('consumed_at', NOW())
    );
    
    RETURN QUERY SELECT TRUE, (v_current_balance - p_amount), FALSE;
END;
$$ LANGUAGE plpgsql;

-- Create function to add credits (for purchases)
CREATE OR REPLACE FUNCTION add_credits(
    p_user_id UUID,
    p_amount DECIMAL,
    p_type VARCHAR,
    p_description TEXT,
    p_reference_type VARCHAR DEFAULT NULL,
    p_reference_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS DECIMAL AS $$
DECLARE
    v_new_balance DECIMAL;
BEGIN
    -- Upsert credit account
    INSERT INTO credit_accounts (user_id, balance, total_purchased_credits, last_purchase_at)
    VALUES (p_user_id, p_amount, p_amount, NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET
        balance = credit_accounts.balance + p_amount,
        total_purchased_credits = credit_accounts.total_purchased_credits + p_amount,
        last_purchase_at = NOW(),
        updated_at = NOW()
    RETURNING balance INTO v_new_balance;
    
    -- Log transaction
    INSERT INTO credit_transactions (
        user_id,
        amount,
        type,
        description,
        reference_type,
        reference_id,
        metadata
    ) VALUES (
        p_user_id,
        p_amount,
        p_type,
        p_description,
        p_reference_type,
        p_reference_id,
        p_metadata || jsonb_build_object('added_at', NOW())
    );
    
    RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on credit_packages (read-only for users)
ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Credit packages are viewable by everyone" 
ON credit_packages FOR SELECT 
USING (is_active = true);

-- Enable realtime for credit_accounts (for live balance updates)
ALTER PUBLICATION supabase_realtime ADD TABLE credit_accounts;

-- Comment on tables
COMMENT ON TABLE credit_packages IS 'Predefined credit packages available for purchase';
COMMENT ON FUNCTION consume_credits IS 'Atomically consume credits with idempotency support';
COMMENT ON FUNCTION add_credits IS 'Add credits to user account (for purchases/bonuses)';
