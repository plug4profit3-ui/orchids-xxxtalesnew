-- Migration: AI Chat Experience Enhancement Roadmap
-- Date: 2025-01-25
-- Description: Adds tables for persistent memories, user activity tracking, A/B testing, and character evolution

-- Feature 1: Persistent Memory Table
-- Stores summarized context per user_id + character_id pair (max 1,000–2,000 tokens)
CREATE TABLE IF NOT EXISTS user_character_memories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    character_id TEXT NOT NULL,
    summary TEXT NOT NULL DEFAULT '', -- Condensed conversation summary
    key_facts TEXT[] DEFAULT '{}', -- Extracted key facts about user
    user_preferences TEXT[] DEFAULT '{}', -- What the user likes/dislikes
    shared_experiences TEXT[] DEFAULT '{}', -- Memorable moments
    last_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_interactions INTEGER DEFAULT 0,
    affection_level INTEGER DEFAULT 0 CHECK (affection_level >= 0 AND affection_level <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, character_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_character_memories_lookup ON user_memories(user_id, character_id);
CREATE INDEX IF NOT EXISTS idx_user_character_memories_updated ON user_memories(updated_at);

-- Feature 4: User Activity Tracking Table
-- Tracks user engagement and inactivity for retention flows
CREATE TABLE IF NOT EXISTS user_activity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_session_id TEXT,
    last_character_id TEXT,
    consecutive_inactive_days INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    retention_status TEXT DEFAULT 'active' CHECK (retention_status IN ('active', 'at_risk', 'inactive', 'churned')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Index for retention queries
CREATE INDEX IF NOT EXISTS idx_user_activity_status ON user_activity(retention_status);
CREATE INDEX IF NOT EXISTS idx_user_activity_inactive ON user_activity(consecutive_inactive_days);

-- Feature 5: A/B Testing Tables
-- Experiments table for feature flags
CREATE TABLE IF NOT EXISTS experiments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    feature_flag TEXT NOT NULL UNIQUE,
    variants JSONB NOT NULL DEFAULT '[]',
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'completed'))),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Experiment assignments per user
CREATE TABLE IF NOT EXISTS experiment_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
    variant_id TEXT NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, experiment_id)
);

-- Experiment metrics tracking
CREATE TABLE IF NOT EXISTS experiment_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
    variant_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_duration INTEGER, -- in seconds
    message_length INTEGER, -- character count
    converted_to_paid BOOLEAN DEFAULT FALSE,
    churned_7_day BOOLEAN DEFAULT FALSE,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for experiment analytics
CREATE INDEX IF NOT EXISTS idx_experiment_metrics_lookup ON experiment_metrics(experiment_id, variant_id);
CREATE INDEX IF NOT EXISTS idx_experiment_assignments_user ON experiment_assignments(user_id);

-- Function to update timestamps automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for auto-updating timestamps
CREATE TRIGGER update_user_memories_updated_at BEFORE UPDATE ON user_memories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_activity_updated_at BEFORE UPDATE ON user_activity
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_experiments_updated_at BEFORE UPDATE ON experiments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate inactivity days
CREATE OR REPLACE FUNCTION calculate_inactivity_days()
RETURNS TRIGGER AS $$
BEGIN
    NEW.consecutive_inactive_days := EXTRACT(DAY FROM (NOW() - NEW.last_active_at));
    
    -- Update retention status based on inactivity
    IF NEW.consecutive_inactive_days < 1 THEN
        NEW.retention_status := 'active';
    ELSIF NEW.consecutive_inactive_days < 3 THEN
        NEW.retention_status := 'at_risk';
    ELSIF NEW.consecutive_inactive_days < 7 THEN
        NEW.retention_status := 'inactive';
    ELSE
        NEW.retention_status := 'churned';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-calculate inactivity
CREATE TRIGGER update_inactivity BEFORE UPDATE ON user_activity
    FOR EACH ROW EXECUTE FUNCTION calculate_inactivity_days();

-- Row Level Security (RLS) Policies
ALTER TABLE user_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiment_metrics ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY user_memories_user_policy ON user_memories
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY user_activity_user_policy ON user_activity
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY experiment_assignments_user_policy ON experiment_assignments
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY experiment_metrics_user_policy ON experiment_metrics
    FOR ALL USING (auth.uid() = user_id);

-- Comments explaining features
COMMENT ON TABLE user_memories IS 'Feature 1: Persistent memories per user+character pair for relationship continuity';
COMMENT ON TABLE user_activity IS 'Feature 4: User activity tracking for exit-intent and retention flows';
COMMENT ON TABLE experiments IS 'Feature 5: A/B testing configuration for prompt variants and pricing';
COMMENT ON TABLE experiment_assignments IS 'Feature 5: User assignments to experiment variants';
COMMENT ON TABLE experiment_metrics IS 'Feature 5: Metrics collection for A/B testing analysis';