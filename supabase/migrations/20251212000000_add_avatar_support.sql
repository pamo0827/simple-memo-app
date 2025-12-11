-- Add avatar support to user_settings table
-- This migration adds avatar fields and creates a storage bucket for avatar images

-- Add avatar columns to user_settings table
ALTER TABLE user_settings
ADD COLUMN avatar_url TEXT,
ADD COLUMN avatar_provider TEXT CHECK (avatar_provider IN ('twitter', 'manual', NULL)),
ADD COLUMN avatar_storage_path TEXT;

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Storage RLS policies for avatars bucket
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Update public_user_profiles view to include avatar_url
CREATE OR REPLACE VIEW public_user_profiles AS
SELECT user_id, public_share_id, are_recipes_public, nickname, avatar_url
FROM user_settings
WHERE are_recipes_public = TRUE;

GRANT SELECT ON public_user_profiles TO anon, authenticated, service_role;

-- Add comments for documentation
COMMENT ON COLUMN user_settings.avatar_url IS 'Public URL to user avatar image';
COMMENT ON COLUMN user_settings.avatar_provider IS 'Source of avatar: twitter (OAuth), manual (user upload), NULL (none)';
COMMENT ON COLUMN user_settings.avatar_storage_path IS 'Internal storage path in Supabase Storage (e.g., user_id/avatar.jpg)';
