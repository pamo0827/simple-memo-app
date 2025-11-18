# MEMOTTO

AIによるシンプルなメモ管理アプリ。レシピサイト、SNS、動画、画像など、あらゆるソースから情報を簡単に取り込み、統一されたフォーマットで管理できます。

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)

---

https://recipe-database-cooki-git-303e59-yoshi0827101328-9306s-projects.vercel.app/

## 主な機能

### AIによる自動抽出
- **URLから**: レシピサイトやSNSのURLを貼り付けるだけで、AIが自動で内容を解析・整形して保存
- **画像から**: 料理本、手書きメモ、スクリーンショットを写真に撮るだけで、AIが文字を認識してメモ化
- **動画から**: YouTube動画の字幕や概要欄を自動解析

### 対応サイト・プラットフォーム
- **レシピサイト**: Cookpad、クラシル、DELISH KITCHEN、白ごはん.com など
- **SNS**: X (Twitter)、Instagram（埋め込み表示対応）
- **動画**: YouTube（通常動画・Shorts）

### スマートフォールバック
APIキー未設定や読み取り失敗時でも、URLを保存した基本メモを自動作成。後から解析も可能。

### 柔軟な管理機能
- **カテゴリー管理**: メモをカテゴリー分けして整理
- **ドラッグ&ドロップ**: 直感的な並び替え
- **埋め込みプレビュー**: X、Instagram、YouTubeの投稿を直接表示
- **共有機能**: メモを公開URLで共有可能
- **検索機能**: タイトル、材料、手順から素早く検索

### ユーザー機能
- **ランキング**: メモ登録数に基づいたユーザーランキング
- **設定のカスタマイズ**: ニックネーム、パスワード、APIキーの管理

---

## 技術スタック

- **フレームワーク**: Next.js 15 (App Router), React 19
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS, shadcn/ui
- **バックエンド**: Supabase (Auth, Postgres, Database Functions)
- **AI**: Google Gemini API (ユーザーが自身のAPIキーを設定)
- **その他ライブラリ**:
  - `@dnd-kit` - ドラッグ&ドロップ
  - `react-tweet` - X埋め込み
  - `react-youtube` - YouTube埋め込み
  - `youtubei.js` - YouTube字幕取得

---

## 使い方

### 1. アカウント登録
メールアドレスとパスワードで無料登録

### 2. APIキーの設定
[Google AI Studio](https://aistudio.google.com/app/apikey) でGemini APIキーを取得し、設定ページで登録
（APIキーがなくてもURLの保存は可能）

### 3. メモの追加
- URLを貼り付けて自動解析
- 画像をアップロードして文字認識
- 手動で入力

---

## テストユーザー

すぐにアプリを試せるテストユーザーを用意しています。

- **Email**: `test@mail.com`
- **Password**: `weqho8-vIkkew-sojbas`

ランディングページの「テストユーザーでログイン」リンクから、情報が自動入力された状態でログインできます。

---

## ローカル開発

```bash
# 依存関係のインストール
npm install

# 環境変数の設定
# .env.local ファイルを作成し、以下を設定:
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 開発サーバーの起動
npm run dev
```

http://localhost:3000 でアプリが起動します。

---

## 特徴的な実装

### Instagram/X スクレイピング
- 複数のフォールバック手法（oEmbed API、HTML解析、JSON抽出）で高い成功率を実現
- エラーページ検出機能により、無駄な処理をスキップ

### フォールバック処理
すべてのAPI ルートで統一されたフォールバック処理を実装：
- APIキー未設定時
- コンテンツ読み取り失敗時
- エラーページ検出時

いずれの場合も、タイトル「メモ」とURLを含む基本メモを自動作成し、ユーザー体験を損なわない設計。

---

## ライセンス

MIT License
