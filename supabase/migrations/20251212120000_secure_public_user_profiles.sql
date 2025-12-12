-- Remove user_id from public_user_profiles view for security
-- user_id is an internal identifier that should not be exposed via public API

-- Drop the existing view
DROP VIEW IF EXISTS public_user_profiles;

-- Recreate the view without user_id
CREATE VIEW public_user_profiles AS
SELECT
    public_share_id,
    nickname,
    avatar_url
FROM user_settings
WHERE are_recipes_public = true;

-- Enable security barrier to ensure RLS policies are enforced
ALTER VIEW public_user_profiles SET (security_barrier = true);

-- Add comment explaining the security measure
COMMENT ON VIEW public_user_profiles IS
'Public view of user profiles who have opted to make their recipes public.
user_id is intentionally excluded to prevent exposure of internal identifiers via the API.';
