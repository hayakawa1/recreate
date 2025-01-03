# ReCreate 仕様書

## 1. ユーザー管理

### 1.1 ユーザー情報
- ID (UUID)
- 名前
- ユーザー名（Twitter ID）
- メールアドレス
- プロフィール画像（Twitter から取得）
- ステータス
  - available: 受付可能
  - availableButHidden: 受付可能（非表示）
  - unavailable: 受付不可
- 自己紹介文（bio）

### 1.2 認証
- Twitter OAuth 2.0 を使用
- NextAuth.js で実装
- JWT 認証方式

## 2. 料金プラン管理

### 2.1 料金プラン情報
- ID (UUID)
- ユーザーID（FK -> users.id）
- 金額（amount）
- 説明文（description）
- Stripe支払いURL（stripe_url）
- 表示/非表示（is_hidden）

### 2.2 料金プラン機能
- 複数プランの設定が可能
- 各プランの表示/非表示切り替え
- プランごとにStripe支払いリンクを設定可能

## 3. リクエスト管理

### 3.1 リクエスト情報
- ID (UUID)
- 連番ID（sequential_id）
- 依頼者ID（requester_id）
- クリエイターID（creator_id）
- 料金プランID（price_entry_id）
- 説明文（description）
- 金額（amount）
- ステータス
  - requested: リクエスト受付
    - 依頼者がリクエストを送信した初期状態
  - rejected: 拒否
    - クリエイターがリクエストを拒否した状態
  - delivered: 納品済み
    - クリエイターが作品を納品した状態
  - paid: 支払い完了
    - 依頼者が支払いを完了し、取引が完了した状態
- 納品ファイルURL（delivery_url）

### 3.2 リクエストフロー
1. ユーザーがクリエイターのページを訪問
2. 料金プランを選択し、リクエスト内容を入力
3. リクエストを送信（ステータス: requested）
4. クリエイターが確認
   - 作業開始する場合: そのまま作業を進める
   - 拒否する場合: ステータスをrejectedに変更
5. 作業完了後、納品ファイルをアップロード（ステータス: delivered）
   - ファイルはCloudflare R2に保存
6. 依頼者が納品物を確認し、クリエイターのStripeリンクから支払い
7. クリエイターが支払いを確認し、ステータスを支払い完了に変更（ステータス: paid）

## 4. ファイル管理
- Cloudflare R2を使用
- 納品ファイルの保存先: `works/${workId}`
- ファイルのアップロード時にContent-Typeを保持

## 5. データベース
- PostgreSQL
- 生のSQLを使用（Prismaは不使用）
- マイグレーション管理
  - `/migrations`ディレクトリで管理
  - 番号付きSQLファイルでバージョン管理

## 6. UI/UX
- Next.js 13 App Router
- TailwindCSS
- レスポンシブデザイン
- ダークモード非対応

### 6.1 主要ページ
- ホーム（`/`）
- プロフィール編集（`/profile`）
- リクエスト一覧（`/requests`）
  - 受信済み（`/requests/received`）
  - 送信済み（`/requests/sent`）
- 通知一覧（`/notifications`）
- 認証関連
  - サインイン（`/auth/signin`）
  - エラー（`/auth/error`）

## 7. API エンドポイント
- `/api/auth/[...nextauth]` - 認証
- `/api/users/me` - 自分のユーザー情報
- `/api/works` - リクエスト作成・一覧取得
- `/api/works/received` - 受信リクエスト一覧
- `/api/works/sent` - 送信リクエスト一覧
- `/api/works/by-id/[id]/deliver` - 納品ファイルアップロード
- `/api/works/by-id/[id]/reject` - リクエスト拒否
- `/api/works/by-id/[id]/paid` - 支払い完了確認
- `/api/notifications` - 通知一覧取得
- `/api/notifications/unread-count` - 未読通知数取得
- `/api/notifications/[id]/read` - 通知を既読にする

## 8. 環境変数
必要な環境変数：
- `DATABASE_URL`: PostgreSQLの接続文字列
- `NEXTAUTH_SECRET`: NextAuth.jsの暗号化キー
- `NEXTAUTH_URL`: アプリケーションのベースURL
- `TWITTER_CLIENT_ID`: Twitter OAuth用クライアントID
- `TWITTER_CLIENT_SECRET`: Twitter OAuth用クライアントシークレット
- `R2_ACCESS_KEY_ID`: Cloudflare R2のアクセスキーID
- `R2_SECRET_ACCESS_KEY`: Cloudflare R2のシークレットアクセスキー
- `R2_BUCKET_NAME`: Cloudflare R2のバケット名 

## 9. 通知機能

### 9.1 通知情報
- ID (UUID)
- ユーザーID（FK -> users.id）
- 作品ID（FK -> works.id）
- 通知タイプ
  - status_changed: ステータス変更通知
  - new_request: 新規リクエスト通知
- メッセージ
- 既読状態
- タイムスタンプ（作成日時、更新日時）

### 9.2 通知トリガー
1. 新規リクエスト時（requested）
   - 通知先: クリエイター
   - タイプ: new_request
2. リクエスト拒否時（rejected）
   - 通知先: 依頼者
   - タイプ: status_changed
3. 納品時（delivered）
   - 通知先: 依頼者
   - タイプ: status_changed
4. 支払い完了時（paid）
   - 通知先: 依頼者
   - タイプ: status_changed

### 9.3 通知の表示
- ヘッダー部分に未読通知数を表示
- 通知一覧ページで詳細を確認可能
- 通知をクリックすると対象の作品ページに遷移
- 既読/未読の管理が可能 