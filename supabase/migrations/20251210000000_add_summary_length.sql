-- Add summary_length column to user_settings table
-- Values: 'short' (簡潔), 'medium' (普通), 'long' (詳細)
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS summary_length TEXT DEFAULT 'medium' CHECK (summary_length IN ('short', 'medium', 'long'));

-- Update existing rows to use default value
UPDATE user_settings
SET summary_length = 'medium'
WHERE summary_length IS NULL;
