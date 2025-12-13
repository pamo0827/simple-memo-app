-- RLSポリシー修正: user_settingsテーブルのUPSERT操作を許可する

-- まずRLSを有効化（念のため）
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーをすべて削除（名前が異なっても確実に消すため）
DROP POLICY IF EXISTS "Users can insert their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can select their own settings" ON user_settings;
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON user_settings;
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON user_settings;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON user_settings;

-- SELECTポリシー (自分のデータのみ参照可)
CREATE POLICY "Users can select their own settings"
ON user_settings
FOR SELECT
USING (auth.uid() = user_id);

-- INSERTポリシー (自分のデータのみ作成可)
CREATE POLICY "Users can insert their own settings"
ON user_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATEポリシー (自分のデータのみ更新可)
CREATE POLICY "Users can update their own settings"
ON user_settings
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
