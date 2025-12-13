-- Fix public_user_profiles view to remove SECURITY DEFINER
-- This addresses the security linter warning

-- Step 1: Drop policies that depend on this view
DROP POLICY IF EXISTS "Public can view recipes from users with public sharing enabled" ON recipes;

-- Step 2: Drop and recreate the view
DROP VIEW IF EXISTS public_user_profiles CASCADE;

-- Recreate view without SECURITY DEFINER (use default SECURITY INVOKER)
CREATE VIEW public_user_profiles 
WITH (security_invoker = true) AS
SELECT 
  user_id, 
  public_share_id, 
  are_recipes_public, 
  nickname, 
  avatar_url
FROM user_settings
WHERE are_recipes_public = TRUE;

-- Grant permissions
GRANT SELECT ON public_user_profiles TO anon, authenticated, service_role;

-- Step 3: Recreate the dependent policy
CREATE POLICY "Public can view recipes from users with public sharing enabled"
ON recipes FOR SELECT TO public
USING (
  EXISTS (
    SELECT 1 FROM public_user_profiles
    WHERE public_user_profiles.user_id = recipes.user_id
  )
);

-- Add comment for documentation
COMMENT ON VIEW public_user_profiles IS 
'Public view of user profiles with public sharing enabled. Uses SECURITY INVOKER for better security.';
