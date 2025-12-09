-- Add summary_length setting to user_settings table
-- This controls the detail level of AI summaries (1=shortest, 5=longest)

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS summary_length INTEGER DEFAULT 3;

COMMENT ON COLUMN user_settings.summary_length IS '要約の文字数レベル（1=最短、3=標準、5=最長）';

-- Validate that summary_length is between 1 and 5
ALTER TABLE user_settings
ADD CONSTRAINT summary_length_range CHECK (summary_length >= 1 AND summary_length <= 5);
