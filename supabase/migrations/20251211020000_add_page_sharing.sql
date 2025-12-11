-- ページごとの共有機能を追加
-- カラムが存在しない場合のみ追加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pages' AND column_name = 'is_public'
  ) THEN
    ALTER TABLE pages ADD COLUMN is_public BOOLEAN DEFAULT FALSE NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pages' AND column_name = 'public_share_id'
  ) THEN
    ALTER TABLE pages ADD COLUMN public_share_id TEXT UNIQUE;
  END IF;
END $$;

-- インデックスを作成
CREATE INDEX IF NOT EXISTS idx_pages_public_share_id ON pages(public_share_id) WHERE public_share_id IS NOT NULL;

-- RLSポリシーを追加：public_share_idでアクセス可能
DROP POLICY IF EXISTS "Public pages are viewable by anyone with share ID" ON pages;
CREATE POLICY "Public pages are viewable by anyone with share ID"
  ON pages FOR SELECT
  USING (is_public = true AND public_share_id IS NOT NULL);

-- レシピとカテゴリーも公開ページの場合は閲覧可能に
DROP POLICY IF EXISTS "Public page recipes are viewable" ON recipes;
CREATE POLICY "Public page recipes are viewable"
  ON recipes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pages
      WHERE pages.id = recipes.page_id
        AND pages.is_public = true
        AND pages.public_share_id IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "Public page categories are viewable" ON categories;
CREATE POLICY "Public page categories are viewable"
  ON categories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pages
      WHERE pages.id = categories.page_id
        AND pages.is_public = true
        AND pages.public_share_id IS NOT NULL
    )
  );
