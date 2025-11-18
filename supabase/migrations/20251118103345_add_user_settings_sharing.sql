-- Add public_share_id and are_recipes_public to user_settings table
ALTER TABLE user_settings
ADD COLUMN public_share_id UUID UNIQUE DEFAULT gen_random_uuid(),
ADD COLUMN are_recipes_public BOOLEAN DEFAULT FALSE;

-- Create a function to generate UUIDs (if not already exists)
CREATE OR REPLACE FUNCTION generate_uuid()
RETURNS UUID AS $$
BEGIN
  RETURN gen_random_uuid();
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on user_settings table if not already enabled
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for public access to user_settings
DROP POLICY IF EXISTS "Public can view user settings with public_share_id" ON user_settings;
CREATE POLICY "Public can view user settings with public_share_id"
ON user_settings FOR SELECT TO public
USING (are_recipes_public = TRUE AND public_share_id IS NOT NULL);

-- Update existing user_settings to ensure public_share_id is set
UPDATE user_settings
SET public_share_id = gen_random_uuid()
WHERE public_share_id IS NULL;