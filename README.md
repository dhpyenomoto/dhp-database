# dhp都市開発GP プロジェクト情報データベース

dhp都市開発グループ（dhp都市開発GP）の **社内専用** プロジェクト情報データベースです。
社員IDを持つ全員が、各プロジェクトを一覧で把握し、新規登録・更新・追記できる共有プラットフォームです。
**誰が・いつ・何を追記／修正／削除したか** をすべて追跡できることを最重要要件としています。

> 社外公開しない社内業務ツールです。

---

## 技術スタック

| 区分 | 採用 |
|------|------|
| フレームワーク | Next.js 15（App Router, TypeScript） |
| UI | Tailwind CSS |
| DB | 開発: SQLite ／ 本番: PostgreSQL（Prisma ORM で切替） |
| 認証 | 社員ID＋パスワード（bcryptハッシュ）。`jose` による署名付きJWTをCookieに保存する自前の軽量セッション |
| 日時 | Asia/Tokyo 基準で表示 |

外部の認証SaaSやbeta依存は使わず、挙動を完全に制御できる構成にしています。

---

## ディレクトリ構成

```
dhp-database/
├── prisma/
│   ├── schema.prisma     # データモデル（User / Project / ProgressEntry / AuditLog）
│   ├── migrations/       # マイグレーション
│   └── seed.ts           # 初期管理者＋サンプルデータ投入
├── src/
│   ├── app/
│   │   ├── login/                    # ログイン画面
│   │   └── (app)/                    # 認証必須グループ
│   │       ├── page.tsx              # プロジェクト一覧（トップ）
│   │       ├── projects/new/         # 新規作成
│   │       ├── projects/[id]/        # 詳細（現状ログ＋変更履歴）
│   │       ├── projects/[id]/edit/   # 編集
│   │       └── admin/                # 管理者（アカウント発行/無効化・復元）
│   ├── actions/          # Server Actions（auth / projects / progress / admin）
│   ├── components/        # UI コンポーネント
│   ├── lib/              # prisma / auth / session / audit / masters / datetime
│   └── middleware.ts     # 未ログインを /login へ誘導
├── .env.example
└── README.md
```

---

## セットアップ手順

前提: Node.js 20 以上。

```bash
cd dhp-database

# 1. 依存パッケージのインストール
npm install

# 2. 環境変数ファイルを用意
cp .env.example .env
#   .env を開き、AUTH_SECRET を十分に長いランダム文字列へ変更してください。
#   生成例:  openssl rand -base64 48

# 3. データベース作成（マイグレーション適用）
npm run prisma:migrate      # 初回は `init` などの名前を聞かれます

# 4. 初期データ投入（初期管理者＋サンプル）
npm run seed
```

### 起動

```bash
# 開発サーバー
npm run dev          # http://localhost:3000

# 本番ビルド＆起動
npm run build
npm run start
```

---

## 初期管理者ログイン情報

`npm run seed` で以下のアカウントが作成されます（**本番では必ずパスワードを変更してください**）。

| 役割 | 社員ID | パスワード |
|------|--------|------------|
| 管理者（admin） | `admin` | `admin1234` |
| 一般（member） | `yamada` | `password123` |

- パスワード変更は、管理者でログイン →「管理者」画面 → 各社員の「PW再設定」から行えます。
- 新しい社員アカウントは管理者が「管理者」画面から発行します。

---

## 機能概要

### プロジェクト（全13項目・指定順）

1. プロジェクトNO.（自動採番 `P-0001` ／ 手動上書き可・一意）
2. プロジェクト状況（**検討中 / 決定 / 進行中 / 完了**・色分けバッジ）
3. プロジェクト名称（必須）
4. 区分（転売用土地／マンション用地／…／その他）
5. 概要（自由記述）
6. 担当者名
7. 情報ルート
8. 取組方針（地上げ／仲介／転売／開発／その他）
9. 土地規模
10. 建物規模
11. 建物種別（古ビル／マンション／…／その他）
12. 価格概要
13. プロジェクトの現状（**進捗ログ**＝時系列で積み上がる追記）

> 選択肢（状況・区分・取組方針・建物種別）は `src/lib/masters.ts` の定数配列で一元管理しています。「その他」項目の追加は同ファイルを編集するだけで反映されます。

### 一覧画面
- 状況の色分けバッジ表示
- 検索（名称・担当者・概要・NO.）／絞り込み（状況・区分・取組方針・建物種別）／並べ替え（更新日時・状況・NO.）
- 「削除済みを表示」トグル（削除済みは取り消し線＋削除者ID・日時）

### 追跡仕様（最重要）
- 作成・更新・削除・追記のすべてに **実行社員IDと日時** を記録・表示
- 削除は **物理削除せず論理削除**。画面では **取り消し線** で残り、削除者ID・日時を併記
- プロジェクト本体の各フィールド変更は **変更前→変更後の差分** を監査ログに保存し、詳細画面の「変更履歴」で時系列閲覧
- 進捗ログは修正すると「編集済み（最終: 社員ID, 日時）」を表示

### 権限
- **一般（member）**: 全プロジェクトの閲覧・新規作成・更新・追記・論理削除
- **管理者（admin）**: 上記に加え、社員アカウントの発行・無効化・パスワード再設定、論理削除（プロジェクト／進捗ログ）の復元

---

## 本番DB（PostgreSQL）への切替方法

provider は **環境変数 `DATABASE_PROVIDER` で自動切替** します（schema.prisma の手編集は不要）。
ビルド／`db:push` の先頭で `scripts/use-db.mjs` が provider を書き換えます。

- 未設定 / `sqlite` → SQLite（ローカル開発の既定）
- `postgresql` → PostgreSQL（本番）

本番（PostgreSQL）の初期化例:

```bash
export DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/dhp_database?schema=public"
export DATABASE_PROVIDER="postgresql"

npm run db:push   # スキーマを本番DBへ反映（PG/SQLite差異を気にせず初期化）
npm run seed      # 初期管理者＋サンプル投入
```

> SQLite で作成済みのデータは自動移行されません。必要に応じて手動で移行してください。

---

## デプロイ手順

### 社内サーバー（Node.js）
```bash
npm install
npm run build
npm run start          # 既定で 0.0.0.0:3000。PORT 環境変数で変更可
```
プロセス管理には PM2 / systemd 等を利用してください。`AUTH_SECRET` と `DATABASE_URL` は本番値を環境変数で渡します。

### Vercel
**詳細な手順は [DEPLOY-VERCEL.md](./DEPLOY-VERCEL.md) を参照してください。** 要点:

- **新規 Vercel プロジェクト**を作成し、**Root Directory を `dhp-database`** に設定
  （既存の公開静的サイトとは別プロジェクトとして共存）。
- 環境変数3つ: `DATABASE_URL`（PostgreSQL）・`AUTH_SECRET`・`DATABASE_PROVIDER=postgresql`。
- Build Command は既定（`npm run build`）でOK。ビルド時に provider 切替＋`prisma generate` が走ります。
- 初回のみ、本番DBへ `npm run db:push` ＋ `npm run seed` でテーブル作成と初期管理者投入。
- SQLite はサーバーレス環境で永続化されないため、本番は必ず PostgreSQL を使用してください。

---

## npm スクリプト

| コマンド | 内容 |
|----------|------|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | `prisma generate` ＋ 本番ビルド |
| `npm run start` | 本番サーバー起動 |
| `npm run prisma:migrate` | マイグレーション作成・適用（開発） |
| `npm run prisma:deploy` | マイグレーション適用（本番・SQLite） |
| `npm run db:push` | スキーマをDBへ直接反映（本番PostgreSQL初期化向け） |
| `npm run seed` | 初期データ投入 |

---

## セキュリティ上の注意

- パスワードは bcrypt でハッシュ化して保存します（平文保存なし）。
- `AUTH_SECRET` は本番で必ず十分に長いランダム値へ変更してください。
- `.env` はコミットしないでください（`.gitignore` 済み）。共有用には `.env.example` を使用します。
- 未ログインユーザーは `middleware.ts` によりすべてのデータ画面から `/login` へ誘導されます。

© dhp都市開発グループ ／ 社内専用
