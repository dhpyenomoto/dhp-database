# Vercel へのデプロイ手順（dhp-database）

このアプリ（`dhpyenomoto/dhp-database` リポジトリ）を Vercel に公開する手順です。
所要 15〜20分。アプリは**リポジトリの直下**に配置されているため、Vercel の
**Root Directory はデフォルト（`/`）のまま**で動作します。

> 重要: 本番では **PostgreSQL** を使用します（SQLite は Vercel のサーバーレス環境で
> 永続化されないため）。provider はビルド時に環境変数 `DATABASE_PROVIDER=postgresql` で
> 自動的に切り替わります（コード変更は不要）。

---

## 全体の流れ

1. PostgreSQL データベースを用意（接続文字列を取得）
2. Vercel で新規プロジェクトを作成（`dhp-database` リポジトリを import）
3. 環境変数を3つ設定
4. デプロイ
5. データベースの初期化（テーブル作成＋初期管理者投入）
6. ログインしてパスワード変更

---

## 1. PostgreSQL データベースを用意

以下のいずれかで PostgreSQL を作成し、**接続文字列（`postgresql://...`）** を控えます。

- **Vercel Postgres**（Vercel管理画面 → Storage → Create Database → Postgres）が最も簡単
- **Neon**（https://neon.tech）/ **Supabase**（https://supabase.com）も可

> Vercel Postgres を使う場合、データベース作成時に `DATABASE_URL` などが
> プロジェクトへ自動で追加されます。手順3の `DATABASE_URL` 設定は不要になることがあります
> （その場合は手順3で `AUTH_SECRET` と `DATABASE_PROVIDER` のみ追加してください）。

---

## 2. Vercel で新規プロジェクトを作成

1. https://vercel.com にログイン → **Add New… → Project**。
2. GitHub リポジトリ **`dhpyenomoto/dhp-database`** を **Import**。
3. **Root Directory** は **デフォルト（`/`）のまま**でOK（変更不要）。
   - アプリがリポジトリ直下にあるため、サブフォルダ指定は不要です。
4. Framework Preset は自動で **Next.js** になります（`vercel.json` で指定済み）。
5. Build/Install コマンドは既定のままで構いません
   （ビルド時に `prisma generate` と provider 切替が自動実行されます）。

この時点ではまだ **Deploy を押さず**、先に手順3の環境変数を設定してください
（押してしまった場合は、手順3のあと再デプロイすればOK）。

---

## 3. 環境変数を設定

プロジェクトの **Settings → Environment Variables** で、以下3つを **Production（必要なら Preview も）** に追加します。

| 変数名 | 値 | 補足 |
|--------|-----|------|
| `DATABASE_URL` | `postgresql://USER:PASSWORD@HOST:5432/DB?schema=public` | 手順1の接続文字列。Vercel Postgres使用時は自動設定済みの場合あり |
| `AUTH_SECRET` | 十分に長いランダム文字列 | 下記コマンドで生成 |
| `DATABASE_PROVIDER` | `postgresql` | これにより本番ビルドが PostgreSQL 用に切り替わる |

`AUTH_SECRET` の生成例（ローカルのターミナル）:

```bash
openssl rand -base64 48
```

---

## 4. デプロイ

- 環境変数を保存したら **Deployments → Redeploy**（または初回 Deploy）を実行。
- ビルドログに `[use-db] datasource provider = "postgresql"` と表示されれば切替成功です。
- デプロイ完了後、発行された URL を開くと **ログイン画面** が表示されます
  （まだDBが空なのでログインはできません → 手順5へ）。

---

## 5. データベースの初期化（テーブル作成＋初期管理者）

本番DBにテーブルを作成し、初期管理者を投入します。**ローカルのPCから本番DBに向けて**実行するのが簡単です。

```bash
# リポジトリを clone（アプリは直下にあります）
git clone https://github.com/dhpyenomoto/dhp-database.git
cd dhp-database
npm install

# 本番DBの接続文字列と provider を指定して実行（値はご自身のものに置換）
export DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB?schema=public"
export DATABASE_PROVIDER="postgresql"

# テーブル作成（マイグレーションSQLではなくスキーマを直接反映）
npm run db:push

# 初期管理者＋サンプルデータ投入
npm run seed
```

> `db:push` は schema.prisma の内容を本番DBへ反映します（PostgreSQL/SQLite間の
> マイグレーションSQL差異を気にせず初期化できます）。
> サンプルが不要な場合は、`prisma/seed.ts` のサンプル投入部分を削除してから実行してください。

実行後、ターミナルに初期管理者の情報が表示されます:

```
初期管理者: 社員ID="dhp0001" / パスワード="eddy0093"
```

---

## 6. ログインしてパスワード変更

1. Vercel の URL を開き、`dhp0001` / `eddy0093` でログイン。
2. ヘッダーの **「管理者」** → 各社員の **「PW再設定」** で、初期パスワードを必ず変更。
3. 必要な社員アカウントを発行（区分 member / admin）。

以上で公開完了です。以降、`main` へ push すると Vercel が自動で再デプロイします。

---

## トラブルシューティング

- **ビルドが `Environment variable not found: DATABASE_URL` で失敗** → 手順3の `DATABASE_URL` が
  Production スコープに設定されているか確認。
- **provider が sqlite のままでビルドされる** → `DATABASE_PROVIDER=postgresql` が設定されているか確認
  （ビルドログの `[use-db]` 行で判別できます）。
- **ログインできない / `relation "User" does not exist`** → 手順5の `npm run db:push` が
  本番DBに対して実行できているか確認。
- **接続数の上限に達する**（大規模利用時）→ `DATABASE_URL` を接続プーリング対応のURL
  （Vercel Postgres / Neon のプーリング用エンドポイント）に変更してください。
