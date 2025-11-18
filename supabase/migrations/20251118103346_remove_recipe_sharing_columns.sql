-- Drop RLS policy for public access to recipes
DROP POLICY IF EXISTS "Public recipes are viewable by everyone." ON recipes;

-- Remove public_id and is_public from recipes table
ALTER TABLE recipes
DROP COLUMN IF EXISTS public_id,
DROP COLUMN IF EXISTS is_public;