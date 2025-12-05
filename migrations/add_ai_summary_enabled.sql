-- データベースマイグレーション: AI要約ON/OFF設定とカスタムプロンプトの追加
-- このSQLをSupabase SQL Editorで実行してください

-- user_settingsテーブルにai_summary_enabledカラムを追加
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS ai_summary_enabled BOOLEAN DEFAULT true;

-- user_settingsテーブルにcustom_promptカラムを追加
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS custom_prompt TEXT;

-- コメントを追加
COMMENT ON COLUMN user_settings.ai_summary_enabled IS 'AI要約機能の有効/無効を制御するフラグ。trueの場合、URLや画像追加時にAI解析を実行。falseの場合、基本メモのみ保存。';
COMMENT ON COLUMN user_settings.custom_prompt IS 'AI解析時に使用するカスタムプロンプト。設定がない場合はデフォルトプロンプトを使用。';
