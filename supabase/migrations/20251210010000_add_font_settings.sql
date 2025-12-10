-- Add font_family and font_size columns to user_settings table
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS font_family TEXT DEFAULT 'system' CHECK (font_family IN ('system', 'serif', 'mono')),
ADD COLUMN IF NOT EXISTS font_size TEXT DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large'));

-- Update existing rows to use default values
UPDATE user_settings
SET font_family = 'system'
WHERE font_family IS NULL;

UPDATE user_settings
SET font_size = 'medium'
WHERE font_size IS NULL;
