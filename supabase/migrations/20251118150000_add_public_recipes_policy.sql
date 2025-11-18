-- Enable RLS on recipes table if not already enabled
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for public access to recipes
-- This policy allows anyone to view recipes if the user has enabled public sharing
DROP POLICY IF EXISTS "Public can view recipes from users with public sharing enabled" ON recipes;
CREATE POLICY "Public can view recipes from users with public sharing enabled"
ON recipes FOR SELECT TO public
USING (
  EXISTS (
    SELECT 1 FROM user_settings
    WHERE user_settings.user_id = recipes.user_id
    AND user_settings.are_recipes_public = TRUE
  )
);
