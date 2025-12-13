-- RLSポリシー修正: user_settingsテーブルのUPSERT操作を許可する
-- user_settingsテーブルの既存ポリシーを削除して再作成
DROP POLICY IF EXISTS "Users can insert their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can select their own settings" ON user_settings;

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
