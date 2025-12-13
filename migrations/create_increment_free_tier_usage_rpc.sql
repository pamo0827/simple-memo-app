-- Function to check and increment free tier usage safely
-- Handles date reset and limit checking atomically

CREATE OR REPLACE FUNCTION increment_free_tier_usage(
  p_user_id UUID,
  p_daily_limit INTEGER
)
RETURNS TABLE (
  allowed BOOLEAN,
  api_key TEXT,
  is_free_tier BOOLEAN,
  remaining_usage INTEGER,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_api_key TEXT;
  v_usage_count INTEGER;
  v_last_date DATE;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- Get user settings (locking the row for update to prevent race conditions)
  SELECT gemini_api_key, daily_usage_count, last_usage_date
  INTO v_api_key, v_usage_count, v_last_date
  FROM user_settings
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Create settings if not exists
  IF NOT FOUND THEN
     INSERT INTO user_settings (user_id, daily_usage_count, last_usage_date, is_using_free_tier)
     VALUES (p_user_id, 0, v_today, true)
     RETURNING gemini_api_key, daily_usage_count, last_usage_date
     INTO v_api_key, v_usage_count, v_last_date;
  END IF;

  -- Check if user has own API Key
  IF v_api_key IS NOT NULL AND trim(v_api_key) <> '' THEN
    -- Update is_using_free_tier to false just in case
    UPDATE user_settings SET is_using_free_tier = false WHERE user_id = p_user_id;
    RETURN QUERY SELECT true, v_api_key, false, 999999, CAST(NULL AS TEXT);
    RETURN;
  END IF;

  -- Ensure is_using_free_tier is true
  UPDATE user_settings SET is_using_free_tier = true WHERE user_id = p_user_id;

  -- Reset logic: if last usage was before today (or null), reset count
  IF v_last_date IS NULL OR v_last_date < v_today THEN
    v_usage_count := 0;
    UPDATE user_settings
    SET daily_usage_count = 0, last_usage_date = v_today
    WHERE user_id = p_user_id;
  END IF;

  -- Check limit
  IF v_usage_count < p_daily_limit THEN
    UPDATE user_settings
    SET daily_usage_count = daily_usage_count + 1,
        last_usage_date = v_today
    WHERE user_id = p_user_id
    RETURNING daily_usage_count INTO v_usage_count;
    
    RETURN QUERY SELECT true, CAST(NULL AS TEXT), true, (p_daily_limit - v_usage_count), CAST(NULL AS TEXT);
  ELSE
    RETURN QUERY SELECT false, CAST(NULL AS TEXT), true, 0, '1日の無料枠上限（' || p_daily_limit || '回）に達しました。明日またご利用いただくか、Gemini APIキーを設定してください。';
  END IF;
END;
$$;
