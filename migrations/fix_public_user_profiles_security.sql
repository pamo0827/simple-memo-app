-- Fix public_user_profiles view to remove SECURITY DEFINER
-- This addresses the security linter warning

DROP VIEW IF EXISTS public_user_profiles;

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

-- Add comment for documentation
COMMENT ON VIEW public_user_profiles IS 
'Public view of user profiles with public sharing enabled. Uses SECURITY INVOKER for better security.';
