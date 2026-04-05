-- Rate Limiting Infrastructure Migration
-- Prevents cost explosions and ensures fair usage during scaling

-- 1. Create rate_limits table for tracking usage
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  resource_type TEXT NOT NULL, -- 'chat', 'image', 'video', 'tts', 'api'
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  window_end TIMESTAMP WITH TIME ZONE,
  request_count INTEGER DEFAULT 0,
  credit_consumed INTEGER DEFAULT 0,
  blocked_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, resource_type, window_start)
);

-- 2. Create rate_limit_violations table for logging
CREATE TABLE IF NOT EXISTS rate_limit_violations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  resource_type TEXT NOT NULL,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  limit_exceeded TEXT NOT NULL,
  request_details JSONB,
  was_blocked BOOLEAN DEFAULT true
);

-- 3. Create ai_routing_logs table for the routing service
CREATE TABLE IF NOT EXISTS ai_routing_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  task_type TEXT NOT NULL,
  provider TEXT NOT NULL,
  cost DECIMAL(10,4),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Add rate limit config to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rate_limit_tier TEXT DEFAULT 'standard';

-- 5. Create rate limit configs table
CREATE TABLE IF NOT EXISTS rate_limit_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tier_name TEXT UNIQUE NOT NULL,
  chat_per_minute INTEGER DEFAULT 20,
  chat_per_hour INTEGER DEFAULT 200,
  chat_per_day INTEGER DEFAULT 1000,
  images_per_hour INTEGER DEFAULT 10,
  images_per_day INTEGER DEFAULT 50,
  video_per_day INTEGER DEFAULT 5,
  tts_per_hour INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true
);

-- 6. Insert default rate limit configs
INSERT INTO rate_limit_configs (tier_name, chat_per_minute, chat_per_hour, chat_per_day, images_per_hour, images_per_day, video_per_day, tts_per_hour) VALUES
  ('free', 10, 50, 200, 3, 10, 1, 5),
  ('starter', 15, 100, 400, 5, 20, 2, 10),
  ('popular', 20, 200, 800, 10, 40, 3, 20),
  ('intense', 30, 300, 1200, 15, 60, 5, 30),
  ('elite', 50, 500, 2000, 25, 100, 10, 50),
  ('vip', 100, 1000, 5000, 50, 200, 20, 100)
ON CONFLICT (tier_name) DO NOTHING;

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_resource ON rate_limits(user_id, resource_type, window_start);
CREATE INDEX IF NOT EXISTS idx_rate_limit_violations_user ON rate_limit_violations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_routing_logs_user ON ai_routing_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_routing_logs_created ON ai_routing_logs(created_at);

-- 8. Create function to check rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_resource_type TEXT,
  p_credits_to_consume INTEGER
) RETURNS TABLE (
  allowed BOOLEAN,
  current_count INTEGER,
  limit INTEGER,
  reset_at TIMESTAMP WITH TIME ZONE,
  message TEXT
) AS $$
DECLARE
  v_tier TEXT;
  v_config RECORD;
  v_current_count INTEGER;
  v_limit INTEGER;
  v_window_start TIMESTAMP WITH TIME ZONE;
  v_window_end TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get user's tier
  SELECT COALESCE(rate_limit_tier, 'free') INTO v_tier
  FROM profiles
  WHERE id = p_user_id;

  -- Get config for tier
  SELECT * INTO v_config
  FROM rate_limit_configs
  WHERE tier_name = v_tier;

  IF v_config IS NULL THEN
    v_tier := 'free';
    SELECT * INTO v_config
    FROM rate_limit_configs
    WHERE tier_name = 'free';
  END IF;

  -- Determine window based on resource type
  v_window_start := DATE_TRUNC('hour', NOW());
  v_window_end := v_window_start + INTERVAL '1 hour';

  -- Get current count
  SELECT COALESCE(request_count, 0) INTO v_current_count
  FROM rate_limits
  WHERE user_id = p_user_id
    AND resource_type = p_resource_type
    AND window_start = v_window_start;

  IF v_current_count IS NULL THEN
    v_current_count := 0;
  END IF;

  -- Determine limit based on resource type
  CASE p_resource_type
    WHEN 'chat' THEN v_limit := v_config.chat_per_hour;
    WHEN 'image' THEN v_limit := v_config.images_per_hour;
    WHEN 'video' THEN v_limit := v_config.video_per_day; -- Video uses daily limit
    WHEN 'tts' THEN v_limit := v_config.tts_per_hour;
    ELSE v_limit := 100;
  END CASE;

  -- Check if allowed
  IF v_current_count >= v_limit THEN
    -- Log violation
    INSERT INTO rate_limit_violations (user_id, resource_type, limit_exceeded, request_details)
    VALUES (p_user_id, p_resource_type, v_limit::TEXT, jsonb_build_object('attempted_credits', p_credits_to_consume));
    
    RETURN QUERY SELECT 
      FALSE,
      v_current_count,
      v_limit,
      v_window_end,
      'Rate limit exceeded. Try again after ' || v_window_end::TEXT;
    RETURN;
  END IF;

  -- Increment count (will be done in application layer)
  RETURN QUERY SELECT 
    TRUE,
    v_current_count,
    v_limit,
    v_window_end,
    'Request allowed';
  RETURN;

EXCEPTION WHEN OTHERS THEN
  -- On error, allow but log
  RAISE WARNING 'Rate limit check failed: %', SQLERRM;
  RETURN QUERY SELECT TRUE, 0, 999999, NOW() + INTERVAL '1 hour', 'Error in rate limiting - request allowed';
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- 9. Create function to increment rate limit counter
CREATE OR REPLACE FUNCTION increment_rate_limit(
  p_user_id UUID,
  p_resource_type TEXT,
  p_credits_consumed INTEGER
) RETURNS VOID AS $$
DECLARE
  v_window_start TIMESTAMP WITH TIME ZONE;
BEGIN
  v_window_start := DATE_TRUNC('hour', NOW());

  INSERT INTO rate_limits (user_id, resource_type, window_start, window_end, request_count, credit_consumed)
  VALUES (p_user_id, p_resource_type, v_window_start, v_window_start + INTERVAL '1 hour', 1, p_credits_consumed)
  ON CONFLICT (user_id, resource_type, window_start)
  DO UPDATE SET
    request_count = rate_limits.request_count + 1,
    credit_consumed = rate_limits.credit_consumed + p_credits_consumed;

EXCEPTION WHEN OTHERS THEN
  -- Silently fail - don't block on rate limit logging
  NULL;
END;
$$ LANGUAGE plpgsql;

-- 10. Add cleanup function for old rate limit records
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS VOID AS $$
BEGIN
  DELETE FROM rate_limits
  WHERE window_end < NOW() - INTERVAL '7 days';
  
  DELETE FROM rate_limit_violations
  WHERE attempted_at < NOW() - INTERVAL '30 days';
  
  DELETE FROM ai_routing_logs
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;
