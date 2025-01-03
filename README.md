# Recreate - クリエイター向け依頼管理サービス

## 概要
Recreateは、クリエイターと依頼者をつなぐプラットフォームです。Twitterアカウントでログインし、クリエイターは自身の料金プランを設定し、依頼者はそれに基づいて依頼を送ることができます。

## 主な機能

### 認証
- Twitterアカウントを使用したログイン/ログアウト
- ログイン状態の永続化

### プロフィール管理
- ユーザー情報の表示（名前、Twitter ID、プロフィール画像、自己紹介文）
- 料金プランの設定（金額、説明文）
- 受付状態の設定（受付中、非公開で受付中、受付停止中）
- 受付可能条件
  - 有効な料金プランが最低1つ必要
    - 有効な料金プランの条件:
      - 金額が設定されている（amount > 0）
      - Stripe URLが設定されている（stripe_url != ''）
      - 非表示になっていない（is_hidden = false）
  - 有効な料金プランがない場合:
    - 自動的に受付停止状態（unavailable）に設定
    - 受付中状態への変更を制限
    - ユーザーに警告メッセージを表示

### 料金プラン
- 複数の料金プランを設定可能
- 各プランに金額と説明文を設定
- プランの表示/非表示切り替え
- プランの追加/編集/削除
- プランの有効性チェック
  - 金額が0以下の場合は無効
  - Stripe URLが未設定の場合は無効
  - 非表示設定の場合は無効
  - 最後の有効なプランを無効にする場合は警告を表示

### 依頼管理
- 料金プランを選択して依頼を送信
- 依頼にメッセージを添付
- 依頼の状態管理（未対応、作業中、却下、納品済み、支払済み）
- 送信した依頼と受信した依頼の一覧表示
- 依頼の状態に応じた各種アクション

### 統計情報
- 送信/受信した依頼の状態別集計
  - 未対応
  - 作業中
  - 却下
  - 納品済み
  - 支払済み

## 技術スタック

### フロントエンド
- Next.js (App Router)
- TypeScript
- TailwindCSS

### バックエンド
- Next.js API Routes
- PostgreSQL (生のSQL)
- NextAuth.js (認証)

### インフラ
- Vercel (デプロイ)
- Vercel Postgres (データベース)
- Cloudflare R2 (ファイルストレージ)

## データベース設計

### users テーブル
- id: UUID (PK) - ユーザーの一意識別子
- name: TEXT - ユーザー名
- username: TEXT UNIQUE - ユーザーのユニークな識別子
- image: TEXT - プロフィール画像のURL
- twitter_id: TEXT UNIQUE - TwitterのID
- status: TEXT - ユーザーの状態 ('available', 'availableButHidden', 'unavailable')
- description: TEXT - 自己紹介文
- created_at: TIMESTAMP WITH TIME ZONE - 作成日時
- updated_at: TIMESTAMP WITH TIME ZONE - 更新日時

### price_entries テーブル
- id: UUID (PK) - 料金プランの一意識別子
- user_id: UUID (FK -> users.id) - プラン作成者のID
- title: TEXT - プランのタイトル
- amount: INTEGER - 金額
- description: TEXT - プランの説明
- stripe_url: TEXT - Stripe決済用のURL
- is_hidden: BOOLEAN - 非表示フラグ
- created_at: TIMESTAMP WITH TIME ZONE - 作成日時
- updated_at: TIMESTAMP WITH TIME ZONE - 更新日時

### works テーブル
- id: UUID (PK) - 依頼の一意識別子
- sequential_id: SERIAL - 連番ID
- requester_id: UUID (FK -> users.id) - 依頼者のID
- creator_id: UUID (FK -> users.id) - クリエイターのID
- price_entry_id: UUID (FK -> price_entries.id) - 選択された料金プランのID
- status: TEXT - 依頼の状態 ('requested', 'rejected', 'delivered', 'paid')
- message: TEXT - 依頼メッセージ
- amount: INTEGER - 金額
- stripe_url: TEXT - Stripe決済用のURL
- file_key: TEXT - 納品ファイルのストレージキー
- created_at: TIMESTAMP WITH TIME ZONE - 作成日時
- updated_at: TIMESTAMP WITH TIME ZONE - 更新日時

## API仕様

### 認証関連
- GET /api/auth/session - セッション情報の取得
- POST /api/auth/signin - サインイン
- POST /api/auth/signout - サインアウト

### ユーザー関連
- GET /api/users/me - 自分のプロフィール情報の取得
  - レスポンス:
    - ユーザー情報
    - 料金プラン一覧
    - 有効な料金プランの存在フラグ
    - 受付可能状態
- PUT /api/users/me - プロフィール情報の更新
  - リクエスト:
    - status: 受付状態
    - description: 自己紹介文
    - priceEntries: 料金プラン一覧
  - バリデーション:
    - 有効な料金プランが存在しない場合、statusをavailableに変更不可
    - 有効な料金プランが1つもない場合は警告を返す
- GET /api/users/[id] - 特定ユーザーの情報取得
  - レスポンス:
    - ユーザー情報
    - 公開されている有効な料金プランのみ
- GET /api/users/[id]/stats - ユーザーの統計情報取得

### 依頼関連
- POST /api/works - 新規依頼の作成
  - バリデーション:
    - 指定された料金プランが有効であることを確認
    - クリエイターが受付可能な状態であることを確認
- GET /api/works/sent - 送信した依頼一覧の取得
- GET /api/works/received - 受信した依頼一覧の取得
- POST /api/works/by-id/[id]/deliver - 依頼の納品
- POST /api/works/by-id/[id]/paid - 支払い完了の登録

## 環境変数
```
DATABASE_URL=postgresql://username:password@host:5432/dbname
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
TWITTER_CLIENT_ID=your-twitter-client-id
TWITTER_CLIENT_SECRET=your-twitter-client-secret
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=your-bucket-name 