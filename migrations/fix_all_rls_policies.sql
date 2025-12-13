-- RLSポリシーとStorage権限を修正・再設定する包括的なスクリプト

-- 0. Storage Bucket 'avatars' の確実な作成とPublic設定
-- バケットが存在しない場合は作成し、存在する場合はpublic設定をtrueにする
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- 1. user_settings テーブルのRLS修正
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- 既存の競合するポリシーを削除
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
DROP POLICY IF EXISTS "Enable all for users based on user_id" ON user_settings;
DROP POLICY IF EXISTS "Users can perform all actions on own settings" ON user_settings;

-- 自身のデータに対する全操作（SELECT, INSERT, UPDATE, DELETE）を許可する単一のポリシーを作成
CREATE POLICY "Users can perform all actions on own settings"
ON user_settings
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- トリガーによって作成された（またはService Roleによって作成された）レコードをユーザーが操作できるようにするための補助ポリシー
-- auth.uid() が user_id と一致するか確認
-- (上記のFOR ALLでカバーされるはずですが、念のため古いポリシーの影響を排除)


-- 2. Storage ('avatars' バケット) のRLS修正
-- Storageへのアクセスには storage.objects テーブルへのRLSが必要

-- 既存のポリシーをクリーンアップ（エラーにならないようにDOブロック等は使えないため、個別にDROP）
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "User can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "User can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "User can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Upload Access" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Update Access" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Delete Access" ON storage.objects;

-- 'avatars' バケットの公開アクセス（閲覧）を許可
CREATE POLICY "Avatar Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- 自身のフォルダへのアップロード（INSERT）を許可
-- フォルダ構造: avatars/{user_id}/{filename} を想定
-- auth.uid() がパスの最初のセグメントと一致することを確認
CREATE POLICY "Avatar Upload Access"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 自身のフォルダ内のファイル更新（UPDATE）を許可
CREATE POLICY "Avatar Update Access"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 自身のフォルダ内のファイル削除（DELETE）を許可
CREATE POLICY "Avatar Delete Access"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
);
