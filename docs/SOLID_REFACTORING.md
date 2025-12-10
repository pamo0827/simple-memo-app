# SOLID原則に基づくリファクタリング

このドキュメントでは、アプリケーションのSOLID原則に基づくリファクタリングについて説明します。

## 目次
1. [概要](#概要)
2. [SOLID原則の適用](#solid原則の適用)
3. [バックエンドのアーキテクチャ](#バックエンドのアーキテクチャ)
4. [フロントエンドのアーキテクチャ](#フロントエンドのアーキテクチャ)
5. [使用例](#使用例)
6. [移行ガイド](#移行ガイド)

---

## 概要

SOLID原則に基づいてコードベースをリファクタリングし、以下の改善を実現しました：

### リファクタリング前の問題点
- ❌ APIルートに複数の責任が混在（認証、バリデーション、ビジネスロジック）
- ❌ 重複コードが多数存在
- ❌ テストが困難
- ❌ 変更の影響範囲が不明確
- ❌ 巨大なコンポーネント（1000行以上）

### リファクタリング後の改善点
- ✅ 各クラス/関数が単一の責任を持つ
- ✅ サービス層による関心の分離
- ✅ 依存性注入による疎結合
- ✅ 再利用可能なカスタムフック
- ✅ 型安全なAPI呼び出し

---

## SOLID原則の適用

### S - Single Responsibility Principle (単一責任の原則)

**適用箇所:**
- `ContentScrapingService`: コンテンツのスクレイピングのみを担当
- `UserContextService`: ユーザー認証とコンテキスト取得のみを担当
- `RecipeApiService`: レシピ関連のAPI呼び出しのみを担当

**Before (悪い例):**
```typescript
// 1つのAPIルートが複数の責任を持つ
async function postHandler(request: NextRequest) {
  // 認証
  const authResult = await authenticateRequest(request)

  // バリデーション
  if (!isAllowedUrl(url)) { ... }

  // ビジネスロジック
  const text = await getContentText(url)

  // AI処理
  const result = await processText(text, apiKey)

  // エラーハンドリング
  return NextResponse.json(...)
}
```

**After (良い例):**
```typescript
// APIルートはHTTPの処理のみ
async function postHandler(request: NextRequest) {
  const userContext = await userContextService.getUserContext(request)
  const result = await contentScrapingService.scrapeUrl(url, userContext.data)
  return NextResponse.json(result.data)
}
```

### O - Open/Closed Principle (開放/閉鎖の原則)

**適用箇所:**
- サービス層: 新しいスクレイピングソースを追加する際、既存コードを変更せずに拡張可能

**例:**
```typescript
// 新しいスクレイピングソースを追加
class InstagramScrapingService extends ContentScrapingService {
  async scrapeInstagram(url: string, userContext: UserContext) {
    // Instagram専用のロジック
  }
}
```

### L - Liskov Substitution Principle (リスコフの置換原則)

**適用箇所:**
- サービスクラスは共通のインターフェース `ServiceResult<T>` を返す
- どのサービスも同じ方法でエラーハンドリング可能

### I - Interface Segregation Principle (インターフェース分離の原則)

**適用箇所:**
- APIの型定義を小さく分割 (`ScrapeUrlRequest`, `UploadFileRequest` など)
- カスタムフックは必要最小限のインターフェースのみを公開

### D - Dependency Inversion Principle (依存性逆転の原則)

**適用箇所:**
- APIルートは具体的な実装ではなく、サービスの抽象化に依存
- コンポーネントはAPIサービスに依存し、fetchの実装詳細を知らない

---

## バックエンドのアーキテクチャ

### レイヤー構造

```
┌─────────────────────────────────┐
│   API Routes (HTTP Layer)       │  ← HTTPリクエスト/レスポンスの処理のみ
├─────────────────────────────────┤
│   Service Layer                 │  ← ビジネスロジック
│   - ContentScrapingService      │
│   - UserContextService          │
├─────────────────────────────────┤
│   Repository Layer (既存)       │  ← データアクセス
│   - recipes.ts                  │
│   - categories.ts               │
└─────────────────────────────────┘
```

### 主要なサービスクラス

#### 1. ContentScrapingService
**責任:** コンテンツのスクレイピングとAI処理

**メソッド:**
- `scrapeUrl()`: 一般的なURLをスクレイピング
- `scrapeYouTube()`: YouTube動画を処理
- `processImageFile()`: 画像ファイルを処理

**使用例:**
```typescript
const result = await contentScrapingService.scrapeUrl(url, userContext)
if (result.success) {
  console.log(result.data)
}
```

#### 2. UserContextService
**責任:** ユーザー認証、認可、設定の取得

**メソッド:**
- `getUserContext()`: 認証とコンテキスト取得（使用回数をカウント）
- `getUserContextWithoutUsage()`: 認証のみ（使用回数をカウントしない）

**使用例:**
```typescript
const userContextResult = await userContextService.getUserContext(request)
if (userContextResult.success) {
  const userContext = userContextResult.data
  // ユーザーコンテキストを使用
}
```

### 統一されたレスポンス形式

すべてのサービスは `ServiceResult<T>` を返します：

```typescript
interface ServiceResult<T> {
  success: boolean
  data?: T
  error?: string
  statusCode?: number
}
```

**利点:**
- 一貫したエラーハンドリング
- 型安全
- テストが容易

---

## フロントエンドのアーキテクチャ

### レイヤー構造

```
┌─────────────────────────────────┐
│   Components (Presentation)     │  ← UIの表示のみ
├─────────────────────────────────┤
│   Custom Hooks (Business Logic) │  ← ビジネスロジック
│   - useRecipeScrap              │
│   - useAutoSave                 │
│   - useUserSettings             │
├─────────────────────────────────┤
│   API Services                  │  ← API呼び出しの抽象化
│   - RecipeApiService            │
│   - ContactApiService           │
└─────────────────────────────────┘
```

### 主要なカスタムフック

#### 1. useRecipeScrap
**責任:** レシピスクレイピングの状態管理

**提供する機能:**
- `scrapeUrl()`: URLをスクレイピング
- `scrapeMultipleUrls()`: 複数URLを一括処理
- `uploadFile()`: ファイルアップロード
- `isScraping`: スクレイピング中の状態
- `scrapeError`: エラーメッセージ

**使用例:**
```typescript
function MyComponent() {
  const { scrapeUrl, isScraping, scrapeError } = useRecipeScrap()

  const handleScrape = async () => {
    const data = await scrapeUrl('https://example.com', true)
    if (data) {
      // 成功時の処理
    }
  }

  return <div>{isScraping ? '読み込み中...' : 'スクレイプ'}</div>
}
```

#### 2. useAutoSave
**責任:** 自動保存のロジック

**提供する機能:**
- デバウンス機能付き自動保存
- 保存状態の表示
- エラーハンドリング

**使用例:**
```typescript
function SettingsForm() {
  const [nickname, setNickname] = useState('')

  const { isSaving, lastSaved } = useAutoSave({
    value: nickname,
    onSave: async (value) => {
      await updateSettings({ nickname: value })
    },
    delay: 1000, // 1秒後に保存
  })

  return (
    <div>
      <Input value={nickname} onChange={(e) => setNickname(e.target.value)} />
      {isSaving ? '保存中...' : lastSaved}
    </div>
  )
}
```

#### 3. useUserSettings
**責任:** ユーザー設定の状態管理

**使用例:**
```typescript
function SettingsPage() {
  const { settings, loading, updateSettings } = useUserSettings(userId)

  if (loading) return <div>読み込み中...</div>

  return <div>ニックネーム: {settings?.nickname}</div>
}
```

### API Services

#### RecipeApiService
**責任:** レシピ関連のAPI呼び出し

**メソッド:**
- `scrapeUrl()`: URLをスクレイピング
- `scrapeYouTube()`: YouTube動画を処理
- `uploadFile()`: ファイルをアップロード
- `scrapeMultipleUrls()`: 複数URLを処理

**利点:**
- 一元化されたAPI呼び出し
- モック化が容易（テスト用）
- エラーハンドリングの統一

---

## 使用例

### バックエンド: 新しいAPIルートの作成

```typescript
// app/api/my-new-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { userContextService } from '@/lib/services/UserContextService'
import { contentScrapingService } from '@/lib/services/ContentScrapingService'

async function postHandler(request: NextRequest) {
  // 1. ユーザー認証とコンテキスト取得
  const userContextResult = await userContextService.getUserContext(request)
  if (!userContextResult.success) {
    return NextResponse.json(
      { error: userContextResult.error },
      { status: userContextResult.statusCode }
    )
  }

  // 2. ビジネスロジックの実行
  const result = await contentScrapingService.scrapeUrl(
    url,
    userContextResult.data
  )

  // 3. レスポンスを返す
  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.statusCode }
    )
  }

  return NextResponse.json(result.data)
}

export const POST = postHandler
```

### フロントエンド: カスタムフックの使用

```typescript
// components/MyComponent.tsx
import { useRecipeScrap } from '@/hooks/useRecipeScrap'

export function MyComponent() {
  const { scrapeUrl, isScraping, scrapeError } = useRecipeScrap()

  const handleSubmit = async (url: string) => {
    const data = await scrapeUrl(url, true)
    if (data) {
      console.log('取得成功:', data)
    } else {
      console.error('エラー:', scrapeError)
    }
  }

  return (
    <div>
      <button onClick={() => handleSubmit('https://example.com')} disabled={isScraping}>
        {isScraping ? '処理中...' : 'スクレイプ'}
      </button>
      {scrapeError && <p className="text-red-500">{scrapeError}</p>}
    </div>
  )
}
```

---

## 移行ガイド

### 既存のAPIルートを移行する手順

1. **サービス層の使用:**
   ```typescript
   // Before
   const { data: settings } = await supabase.from('user_settings').select(...)

   // After
   const userContextResult = await userContextService.getUserContext(request)
   ```

2. **エラーハンドリングの統一:**
   ```typescript
   // Before
   return NextResponse.json({ error: 'エラー' }, { status: 500 })

   // After
   if (!result.success) {
     return NextResponse.json(
       { error: result.error },
       { status: result.statusCode }
     )
   }
   ```

### 既存のコンポーネントを移行する手順

1. **API呼び出しをサービスに移行:**
   ```typescript
   // Before
   const response = await fetch('/api/scrape-recipe', { ... })

   // After
   import { recipeApiService } from '@/lib/api/RecipeApiService'
   const result = await recipeApiService.scrapeUrl({ url, useAI })
   ```

2. **ビジネスロジックをカスタムフックに移行:**
   ```typescript
   // Before (コンポーネント内にロジックがある)
   const [isScraping, setIsScraping] = useState(false)
   const handleScrape = async () => {
     setIsScraping(true)
     // ... ロジック
     setIsScraping(false)
   }

   // After (カスタムフックを使用)
   const { scrapeUrl, isScraping } = useRecipeScrap()
   ```

---

## テストの容易性

### サービスのモック化

```typescript
// テスト用のモック
jest.mock('@/lib/services/ContentScrapingService', () => ({
  contentScrapingService: {
    scrapeUrl: jest.fn().mockResolvedValue({
      success: true,
      data: { type: 'summary', data: 'テストデータ' }
    })
  }
}))
```

### カスタムフックのテスト

```typescript
import { renderHook, act } from '@testing-library/react'
import { useRecipeScrap } from '@/hooks/useRecipeScrap'

test('scrapeUrlが正常に動作する', async () => {
  const { result } = renderHook(() => useRecipeScrap())

  await act(async () => {
    const data = await result.current.scrapeUrl('https://example.com', true)
    expect(data).toBeTruthy()
  })
})
```

---

## まとめ

このリファクタリングにより、以下の改善が実現されました：

### コードの品質
- ✅ 単一責任の原則により、各ファイル/クラスの目的が明確
- ✅ 依存性注入により、テストとモック化が容易
- ✅ 型安全性の向上

### 開発体験
- ✅ 新機能の追加が容易
- ✅ バグの影響範囲が限定的
- ✅ コードの理解が容易

### 保守性
- ✅ 変更の影響範囲が明確
- ✅ 重複コードの削減
- ✅ 一貫したエラーハンドリング

---

## 参考リソース

- [SOLID原則について](https://en.wikipedia.org/wiki/SOLID)
- [カスタムフックのベストプラクティス](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [サービス層パターン](https://martinfowler.com/eaaCatalog/serviceLayer.html)
