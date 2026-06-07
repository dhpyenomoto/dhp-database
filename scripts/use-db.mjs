// prisma/schema.prisma の datasource provider を環境変数で切り替える。
//   DATABASE_PROVIDER=postgresql  → 本番（Vercel など）
//   未設定 / sqlite               → ローカル開発（既定）
// build / postinstall の先頭で実行され、環境に合った Prisma Client を生成する。
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(__dirname, "..", "prisma", "schema.prisma");

const requested = (process.env.DATABASE_PROVIDER || "sqlite").toLowerCase();
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
