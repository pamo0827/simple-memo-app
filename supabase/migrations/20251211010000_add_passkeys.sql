-- パスキー（WebAuthn）認証情報を保存するテーブルを作成
CREATE TABLE IF NOT EXISTS passkeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter BIGINT NOT NULL DEFAULT 0,
  device_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- インデックスを作成
CREATE INDEX IF NOT EXISTS idx_passkeys_user_id ON passkeys(user_id);
CREATE INDEX IF NOT EXISTS idx_passkeys_credential_id ON passkeys(credential_id);

-- RLSを有効化
ALTER TABLE passkeys ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のパスキーのみ表示・管理可能
CREATE POLICY "Users can view their own passkeys"
  ON passkeys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own passkeys"
  ON passkeys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own passkeys"
  ON passkeys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own passkeys"
  ON passkeys FOR DELETE
  USING (auth.uid() = user_id);
