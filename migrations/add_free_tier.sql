-- Add free tier tracking columns to user_settings table
-- This enables 1 day / 10 requests free tier with default API key

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS is_using_free_tier BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS daily_usage_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_usage_date DATE DEFAULT CURRENT_DATE;

COMMENT ON COLUMN user_settings.is_using_free_tier IS '無料枠を使用しているかどうか。trueの場合、デフォルトAPIキーを使用し、1日10回までの制限がある。独自のAPIキーを設定するとfalseになる。';
COMMENT ON COLUMN user_settings.daily_usage_count IS '本日の使用回数。毎日リセットされる。';
COMMENT ON COLUMN user_settings.last_usage_date IS '最後に使用した日付。日付が変わったらdaily_usage_countをリセットするために使用。';

-- Update existing users to use free tier by default
UPDATE user_settings
SET is_using_free_tier = true
WHERE gemini_api_key IS NULL OR gemini_api_key = '';
