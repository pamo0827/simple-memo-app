-- サイドバー表示設定カラムの追加
-- user_settings テーブルに sidebar_visible カラムを追加
-- デフォルト値は false（非表示）
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS sidebar_visible BOOLEAN DEFAULT false;

-- 既存ユーザーのデフォルト値を設定（念のため）
UPDATE user_settings
SET sidebar_visible = false
WHERE sidebar_visible IS NULL;
