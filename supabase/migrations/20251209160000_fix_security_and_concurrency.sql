-- Fix concurrency with Atomic RPC for Free Tier Usage
CREATE OR REPLACE FUNCTION increment_free_tier_usage(p_user_id UUID, p_daily_limit INTEGER)
RETURNS TABLE (
  allowed BOOLEAN,
  is_free_tier BOOLEAN,
  remaining_usage INTEGER,
  api_key TEXT,
  error_message TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_settings RECORD;
  v_today DATE := CURRENT_DATE;
  v_new_count INTEGER;
  v_reset BOOLEAN := FALSE;
BEGIN
  -- Get user settings with row lock to prevent race conditions
  SELECT * INTO v_settings FROM user_settings WHERE user_id = p_user_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, FALSE, 0, NULL::TEXT, 'User settings not found'::TEXT;
    RETURN;
  END IF;

  -- Check if user has custom API key
  IF v_settings.gemini_api_key IS NOT NULL AND v_settings.gemini_api_key <> '' THEN
    RETURN QUERY SELECT TRUE, FALSE, -1, v_settings.gemini_api_key, NULL::TEXT;
    RETURN;
  END IF;

  -- Free tier logic
  -- Check if date reset is needed
  IF v_settings.last_usage_date IS NULL OR v_settings.last_usage_date < v_today THEN
    v_new_count := 1; -- Reset and count this one
    v_reset := TRUE;
  ELSE
    v_new_count := v_settings.daily_usage_count + 1;
  END IF;

  -- Check limit
  IF NOT v_reset AND v_settings.daily_usage_count >= p_daily_limit THEN
    RETURN QUERY SELECT FALSE, TRUE, 0, NULL::TEXT, 'Daily limit reached'::TEXT;
    RETURN;
  END IF;

  -- Update settings
  UPDATE user_settings
  SET daily_usage_count = v_new_count,
      last_usage_date = v_today,
      is_using_free_tier = TRUE
  WHERE user_id = p_user_id;

  RETURN QUERY SELECT TRUE, TRUE, p_daily_limit - v_new_count, NULL::TEXT, NULL::TEXT;
END;
$$;

-- Secure View for public user profiles
-- This exposes only safe information for users who have enabled public sharing
CREATE OR REPLACE VIEW public_user_profiles AS
SELECT user_id, public_share_id, are_recipes_public, nickname
FROM user_settings
WHERE are_recipes_public = TRUE;

-- Grant access to view (Supabase specific roles)
GRANT SELECT ON public_user_profiles TO anon, authenticated, service_role;

-- Enable RLS on user_settings
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Strict Policies for user_settings (Direct table access restricted to owner)
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
DROP POLICY IF EXISTS "Public can view public profiles" ON user_settings;

CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Update RLS Policy for Recipes to use the View
DROP POLICY IF EXISTS "Public can view recipes from users with public sharing enabled" ON recipes;

CREATE POLICY "Public can view recipes from users with public sharing enabled"
ON recipes FOR SELECT TO public
USING (
  EXISTS (
    SELECT 1 FROM public_user_profiles
    WHERE public_user_profiles.user_id = recipes.user_id
  )
);