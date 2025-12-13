-- 関数定義のセキュリティ修正（構文エラー修正版）

-- 1. increment_free_tier_usage 関数の修正
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
SET search_path = public, pg_temp
AS $$
DECLARE
  v_api_key TEXT;
  v_usage_count INTEGER;
  v_last_date DATE;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- ロックを取得して競合を防ぐ
  SELECT gemini_api_key, daily_usage_count, last_usage_date
  INTO v_api_key, v_usage_count, v_last_date
  FROM user_settings
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- レコードが存在しない場合作成
  IF NOT FOUND THEN
     INSERT INTO user_settings (user_id, daily_usage_count, last_usage_date, is_using_free_tier)
     VALUES (p_user_id, 0, v_today, true)
     RETURNING gemini_api_key, daily_usage_count, last_usage_date
     INTO v_api_key, v_usage_count, v_last_date;
  END IF;

  -- API Keyがある場合は制限なし
  IF v_api_key IS NOT NULL AND trim(v_api_key) <> '' THEN
    UPDATE user_settings SET is_using_free_tier = false WHERE user_id = p_user_id;
    RETURN QUERY SELECT true, v_api_key, false, 999999, CAST(NULL AS TEXT);
    RETURN;
  END IF;

  -- 無料枠使用フラグを設定
  UPDATE user_settings SET is_using_free_tier = true WHERE user_id = p_user_id;

  -- 日付が変わっていたらリセット
  IF v_last_date IS NULL OR v_last_date < v_today THEN
    v_usage_count := 0;
    UPDATE user_settings
    SET daily_usage_count = 0, last_usage_date = v_today
    WHERE user_id = p_user_id;
  END IF;

  -- 上限チェック
  IF v_usage_count < p_daily_limit THEN
    UPDATE user_settings
    SET daily_usage_count = daily_usage_count + 1,
        last_usage_date = v_today
    WHERE user_id = p_user_id
    RETURNING daily_usage_count INTO v_usage_count;
    
    RETURN QUERY SELECT true, CAST(NULL AS TEXT), true, (p_daily_limit - v_usage_count), CAST(NULL AS TEXT);
  ELSE
    RETURN QUERY SELECT false, CAST(NULL AS TEXT), true, 0, '1日の無料枠上限に達しました。';
  END IF;
END;
$$;
