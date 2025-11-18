-- supabase/migrations/20251118103345_add_sharing_columns_to_recipes.sql

ALTER TABLE recipes
ADD COLUMN public_id UUID DEFAULT gen_random_uuid() UNIQUE,
ADD COLUMN is_public BOOLEAN DEFAULT FALSE;

-- RLSポリシーの追加
-- 認証されていないユーザーでも public_id を使って公開レシピを読み取れるようにする
CREATE POLICY "Public recipes are viewable by everyone."
ON recipes FOR SELECT
USING (is_public = TRUE);
