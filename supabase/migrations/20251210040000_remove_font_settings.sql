-- Remove font_family and font_size columns from user_settings table
-- These features are being removed from the application

ALTER TABLE user_settings
DROP COLUMN IF EXISTS font_family,
DROP COLUMN IF EXISTS font_size;
