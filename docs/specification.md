# ReCreate 仕様書

## 1. ユーザー管理

### 1.1 ユーザー情報
- ID (自動生成)
- 名前
- ユーザー名（Twitter ID）
- メールアドレス
- プロフィール画像（Twitter から取得）
- ステータス
  - available: 受付可能
  - availableButHidden: 受付可能（非表示）
  - unavailable: 受付不可
- 自己紹介文
- 金額（料金設定）

### 1.2 認証
- Twitter OAuth 2.0 を使用
- NextAuth.js で実装
- JWT 認証方式
- セッション有効期限: 30日

## 2. リクエスト管理

### 2.1 リクエスト情報
- ID (自動生成)
- 作成日時
- 更新日時
- 説明文
- 金額（クリエイターの設定金額を自動適用）
- ステータス
  - requested: リクエスト受付
    - クリエイターにリクエストが送信された初期状態
    - クリエイターはこの状態で承認または拒否を選択可能
  - rejected: 拒否
    - クリエイターがリクエストを拒否した状態
    - 一度拒否されたリクエストは再度受付不可
  - delivered: 納品済み
    - クリエイターが作品を納品した状態
    - 納品ファイルURLが設定される
    - リクエスターは納品物を確認し、支払い処理へ進む
  - paid: 支払い完了
    - リクエスターが支払いを完了し、クリエイターが確認した状態
    - 取引の最終状態
    - クリエイターが支払いを確認後、このステータスに変更
- 納品ファイルURL
- クリエイターID
- リクエスター（依頼者）ID

### 2.2 リクエストフロー
1. ユーザーがクリエイターのページを訪問
2. リクエスト内容を入力（金額は自動設定）
3. リクエストを送信（ステータス: requested）
4. クリエイターが確認
   - 承認の場合: 作業開始
   - 拒否の場合: ステータスがrejectedに変更
5. 作業完了後、納品ファイルをアップロード（ステータス: delivered）
6. リクエスターが納品物を確認し、クリエイターのStripeリンクから支払い
7. クリエイターが支払いを確認し、ステータスを支払い完了に変更（ステータス: paid）

## 3. ファイル管理
- Firebase Storage を使用
- 納品ファイルの保存先
- ファイル名形式: `deliveries/${workId}/${fileName}`

## 4. データベース
- PostgreSQL
- Prisma ORM を使用
- 主要テーブル
  - User
  - Work
  - Account (OAuth)
  - Session

## 5. UI/UX
- Next.js 13 App Router
- TailwindCSS
- レスポンシブデザイン
- ダークモード非対応

### 5.1 主要ページ
- ホーム（`/`）
- ユーザーページ（`/u/[userId]`）
- プロフィール編集（`/profile`）
- リクエスト一覧（`/requests`）
  - 受信済み（`/requests/received`）
  - 送信済み（`/requests/sent`）
- 認証関連
  - サインイン（`/auth/signin`）
  - エラー（`/auth/error`）

## 6. API エンドポイント
- `/api/auth/[...nextauth]` - 認証
- `/api/users/[id]` - ユーザー情報
- `/api/works` - リクエスト作成
- `/api/works/received` - 受信リクエスト一覧
- `/api/works/sent` - 送信リクエスト一覧
- `/api/works/[id]/delivery` - 納品ファイルアップロード
- `/api/works/[id]/reject` - リクエスト拒否
- `/api/works/[id]/paid` - 支払い完了確認 