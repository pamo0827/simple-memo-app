-- Fix public sharing by allowing access to public profiles via a secure function
-- This bypasses the strict RLS on user_settings for public profiles only

-- 1. Create a security definer function to get public profiles
CREATE OR REPLACE FUNCTION get_public_profiles()
RETURNS TABLE (
  user_id UUID,
  public_share_id UUID,
  are_recipes_public BOOLEAN,
  nickname TEXT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.user_id, 
    us.public_share_id, 
    us.are_recipes_public, 
    us.nickname
  FROM user_settings us
  WHERE us.are_recipes_public = TRUE;
END;
$$;

-- 2. Update the view to use the function
CREATE OR REPLACE VIEW public_user_profiles AS
SELECT * FROM get_public_profiles();

-- 3. Grant access
GRANT SELECT ON public_user_profiles TO anon, authenticated, service_role;
