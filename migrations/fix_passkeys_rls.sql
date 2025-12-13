-- passkeys テーブルのRLSポリシー設定

-- RLSを有効化
ALTER TABLE passkeys ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除（もしあれば）
DROP POLICY IF EXISTS "Users can perform all actions on own passkeys" ON passkeys;
DROP POLICY IF EXISTS "Users can view own passkeys" ON passkeys;
DROP POLICY IF EXISTS "Users can insert own passkeys" ON passkeys;
DROP POLICY IF EXISTS "Users can update own passkeys" ON passkeys;
DROP POLICY IF EXISTS "Users can delete own passkeys" ON passkeys;

-- 包括的なポリシーを作成
CREATE POLICY "Users can perform all actions on own passkeys"
ON passkeys FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
