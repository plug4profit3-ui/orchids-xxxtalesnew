-- Migration: Credit-based Usage System
-- Date: 2025-03-08
-- Description: Adds tables and RPC functions for prepaid credit accounting,
--              idempotent deductions, and real-time balance tracking.

-- ============================================================
-- 1. credit_accounts  (one row per user, current balance)
-- ============================================================
CREATE TABLE IF NOT EXISTS credit_accounts (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    balance DECIMAL(12, 4) NOT NULL DEFAULT 0 CHECK (balance >= 0),
    daily_messages_left INTEGER NOT NULL DEFAULT 10,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast balance lookups
CREATE INDEX IF NOT EXISTS idx_credit_accounts_user ON credit_accounts(user_id);

-- ============================================================
-- 2. credit_transactions  (append-only audit ledger)
-- ============================================================
CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('purchase', 'consumption', 'refund', 'expiry', 'bonus', 'api_call')),
    amount DECIMAL(12, 4) NOT NULL,   -- positive = credit added, negative = credit consumed
    description TEXT,
    reference_id TEXT,                -- e.g. chat_message_id, stripe payment_intent_id
    idempotency_key TEXT UNIQUE,      -- prevents duplicate deductions
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(user_id, type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created ON credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_idempotency ON credit_transactions(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- ============================================================
-- 3. credit_packages  (available credit bundles for purchase)
-- ============================================================
CREATE TABLE IF NOT EXISTS credit_packages (
    id TEXT PRIMARY KEY,             -- e.g. 'starter', 'popular', 'intense', 'elite', 'vip'
    credits_amount DECIMAL(12, 4) NOT NULL,
    price_eur INTEGER NOT NULL,      -- in euro cents
    stripe_product_id TEXT,
    stripe_price_id TEXT,
    is_subscription BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed default packages
INSERT INTO credit_packages (id, credits_amount, price_eur, stripe_price_id, is_subscription) VALUES
    ('starter',  80,   499,  'price_1T0T8dLkRK7Wa5UchZI5dvqs', FALSE),
    ('popular',  250,  999,  'price_1T0T8eLkRK7Wa5UcuJnHqqEz', FALSE),
    ('intense',  600,  1999, 'price_1T0T8eLkRK7Wa5Ucoqy3whDs', FALSE),
    ('elite',    1500, 3999, 'price_1T0T8fLkRK7Wa5Uc7OOb4ntC', FALSE),
    ('vip',      400,  1799, 'price_1T0T8dLkRK7Wa5UcwluoAFV3', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. Atomic deduction RPC  (prevents race conditions)
--    Returns: (success BOOL, new_balance DECIMAL, error_code TEXT)
-- ============================================================
CREATE OR REPLACE FUNCTION deduct_credits(
    p_user_id     UUID,
    p_amount      DECIMAL,
    p_type        TEXT,
    p_description TEXT DEFAULT NULL,
    p_reference_id TEXT DEFAULT NULL,
    p_idempotency_key TEXT DEFAULT NULL,
    p_metadata    JSONB DEFAULT '{}'
)
RETURNS TABLE(success BOOLEAN, new_balance DECIMAL, error_code TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_balance DECIMAL;
    v_new_balance     DECIMAL;
BEGIN
    -- Check idempotency: if this key already exists, return the balance without deducting again
    IF p_idempotency_key IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM credit_transactions
            WHERE idempotency_key = p_idempotency_key
        ) THEN
            SELECT balance INTO v_current_balance
            FROM credit_accounts
            WHERE user_id = p_user_id;
            RETURN QUERY SELECT TRUE, COALESCE(v_current_balance, 0::DECIMAL), 'already_processed'::TEXT;
            RETURN;
        END IF;
    END IF;

    -- Atomic read-and-update with row lock
    UPDATE credit_accounts
    SET balance    = balance - p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id
      AND balance  >= p_amount
    RETURNING balance INTO v_new_balance;

    IF NOT FOUND THEN
        -- Either account missing or balance too low
        SELECT balance INTO v_current_balance
        FROM credit_accounts
        WHERE user_id = p_user_id;

        IF v_current_balance IS NULL THEN
            RETURN QUERY SELECT FALSE, 0::DECIMAL, 'account_not_found'::TEXT;
        ELSE
            RETURN QUERY SELECT FALSE, v_current_balance, 'insufficient_credits'::TEXT;
        END IF;
        RETURN;
    END IF;

    -- Record transaction
    INSERT INTO credit_transactions
        (user_id, type, amount, description, reference_id, idempotency_key, metadata)
    VALUES
        (p_user_id, p_type, -p_amount, p_description, p_reference_id, p_idempotency_key, p_metadata);

    RETURN QUERY SELECT TRUE, v_new_balance, NULL::TEXT;
END;
$$;

-- ============================================================
-- 5. Add credits RPC  (atomic credit addition)
-- ============================================================
CREATE OR REPLACE FUNCTION add_credits(
    p_user_id     UUID,
    p_amount      DECIMAL,
    p_type        TEXT,
    p_description TEXT DEFAULT NULL,
    p_reference_id TEXT DEFAULT NULL,
    p_idempotency_key TEXT DEFAULT NULL,
    p_metadata    JSONB DEFAULT '{}'
)
RETURNS DECIMAL
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_balance DECIMAL;
BEGIN
    -- Check idempotency
    IF p_idempotency_key IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM credit_transactions
            WHERE idempotency_key = p_idempotency_key
        ) THEN
            SELECT balance INTO v_new_balance FROM credit_accounts WHERE user_id = p_user_id;
            RETURN COALESCE(v_new_balance, 0);
        END IF;
    END IF;

    INSERT INTO credit_accounts (user_id, balance, updated_at)
    VALUES (p_user_id, p_amount, NOW())
    ON CONFLICT (user_id) DO UPDATE
        SET balance    = credit_accounts.balance + EXCLUDED.balance,
            updated_at = NOW()
    RETURNING balance INTO v_new_balance;

    INSERT INTO credit_transactions
        (user_id, type, amount, description, reference_id, idempotency_key, metadata)
    VALUES
        (p_user_id, p_type, p_amount, p_description, p_reference_id, p_idempotency_key, p_metadata);

    RETURN v_new_balance;
END;
$$;

-- ============================================================
-- 6. Row Level Security
-- ============================================================
ALTER TABLE credit_accounts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_packages     ENABLE ROW LEVEL SECURITY;

-- Users can read their own balance
CREATE POLICY credit_accounts_select ON credit_accounts
    FOR SELECT USING (auth.uid() = user_id);

-- Users can read their own transactions
CREATE POLICY credit_transactions_select ON credit_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Anyone can read active packages
CREATE POLICY credit_packages_select ON credit_packages
    FOR SELECT USING (is_active = TRUE);

-- Service role (backend) bypasses RLS automatically

-- ============================================================
-- 7. Trigger to auto-create credit_accounts on new user signup
-- ============================================================
CREATE OR REPLACE FUNCTION on_auth_user_created_credit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO credit_accounts (user_id, balance, daily_messages_left)
    VALUES (NEW.id, 50, 10)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_credit ON auth.users;
CREATE TRIGGER on_auth_user_created_credit
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION on_auth_user_created_credit();

-- Comments
COMMENT ON TABLE credit_accounts IS 'Current credit balance per user (single source of truth)';
COMMENT ON TABLE credit_transactions IS 'Append-only audit ledger for all credit movements';
COMMENT ON TABLE credit_packages IS 'Available credit bundles available for purchase';
COMMENT ON FUNCTION deduct_credits IS 'Atomically deducts credits with idempotency key support to prevent race conditions';
COMMENT ON FUNCTION add_credits IS 'Atomically adds credits with idempotency key support';
