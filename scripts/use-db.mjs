// prisma/schema.prisma の datasource provider を環境変数で切り替える。
//   DATABASE_PROVIDER=postgresql        → 明示的に本番（Vercel など）
//   未設定だが DATABASE_URL が postgres → 自動で postgresql
//   それ以外                            → ローカル開発の sqlite（既定）
// build / postinstall の先頭で実行され、環境に合った Prisma Client を生成する。
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(__dirname, "..", "prisma", "schema.prisma");

// 1) DATABASE_PROVIDER が明示されていれば最優先。
// 2) 無ければ接続文字列（DATABASE_URL 等）が postgres 系かどうかで自動判定。
//    → Vercel/Neon 連携では DATABASE_URL が自動投入されるため、
//      DATABASE_PROVIDER を手で設定しなくても本番で正しく PostgreSQL を選ぶ。
let requested = (process.env.DATABASE_PROVIDER || "").toLowerCase();
if (!requested) {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    "";
  requested = /^postgres(ql)?:\/\//i.test(url) ? "postgresql" : "sqlite";
}
const target = requested === "postgresql" || requested === "postgres"
  ? "postgresql"
  : "sqlite";

const schema = readFileSync(schemaPath, "utf8");

// datasource ブロックの provider のみ置換（generator の provider は対象外）
const updated = schema.replace(
  /provider\s*=\s*"(sqlite|postgresql)"/,
  `provider = "${target}"`
);

if (updated !== schema) {
  writeFileSync(schemaPath, updated);
  console.log(`[use-db] datasource provider = "${target}"`);
} else {
  console.log(`[use-db] datasource provider は既に "${target}" です`);
}
