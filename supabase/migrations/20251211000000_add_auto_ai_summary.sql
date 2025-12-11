-- Add auto_ai_summary column to user_settings table
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS auto_ai_summary BOOLEAN NOT NULL DEFAULT true;

-- Add comment
COMMENT ON COLUMN user_settings.auto_ai_summary IS 'Whether to automatically start AI summary when URL is entered';
