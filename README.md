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

### 料金プラン
- 複数の料金プランを設定可能
- 各プランに金額と説明文を設定
- プランの表示/非表示切り替え
- プランの追加/編集/削除

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

## データベース設計

### users テーブル
- id: UUID (PK)
- name: TEXT
- username: TEXT
- image: TEXT
- description: TEXT
- status: TEXT ('available', 'availableButHidden', 'unavailable')
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

### price_entries テーブル
- id: UUID (PK)
- user_id: UUID (FK -> users.id)
- amount: INTEGER
- description: TEXT
- stripe_url: TEXT
- is_hidden: BOOLEAN
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

### works テーブル
- id: UUID (PK)
- user_id: UUID (FK -> users.id)
- creator_id: UUID (FK -> users.id)
- price_entry_id: UUID (FK -> price_entries.id)
- message: TEXT
- status: TEXT ('pending', 'accepted', 'rejected', 'delivered', 'paid')
- created_at: TIMESTAMP
- updated_at: TIMESTAMP 