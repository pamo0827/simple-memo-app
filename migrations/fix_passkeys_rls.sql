-- passkeys テーブルのRLSポリシー設定
-- パスキー認証はログイン前に行われるため、特別な考慮が必要

-- RLSを有効化
ALTER TABLE passkeys ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除（もしあれば）
DROP POLICY IF EXISTS "Users can perform all actions on own passkeys" ON passkeys;
DROP POLICY IF EXISTS "Users can view own passkeys" ON passkeys;
DROP POLICY IF EXISTS "Users can insert own passkeys" ON passkeys;
DROP POLICY IF EXISTS "Users can update own passkeys" ON passkeys;
DROP POLICY IF EXISTS "Users can delete own passkeys" ON passkeys;
DROP POLICY IF EXISTS "Anyone can read passkeys for authentication" ON passkeys;

-- 認証のためのポリシー（credential_id による SELECT を許可）
-- これはログイン前のパスキー認証で必要
CREATE POLICY "Anyone can read passkeys for authentication"
ON passkeys FOR SELECT
TO public
USING (true);

-- 認証済みユーザーが自分のパスキーを挿入できる
CREATE POLICY "Users can insert own passkeys"
ON passkeys FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 認証済みユーザーが自分のパスキーを更新できる（last_used_atの更新など）
CREATE POLICY "Users can update own passkeys"
ON passkeys FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 認証済みユーザーが自分のパスキーを削除できる
CREATE POLICY "Users can delete own passkeys"
ON passkeys FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
