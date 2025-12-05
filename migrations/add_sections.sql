-- Add sections column to recipes table
-- This column allows users to add custom sections to their memos

ALTER TABLE recipes
ADD COLUMN IF NOT EXISTS sections JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN recipes.sections IS 'カスタムセクションの配列。各セクションは {title: string, content: string} の形式。従来の ingredients/instructions に加えて、自由にセクションを追加できる。';
