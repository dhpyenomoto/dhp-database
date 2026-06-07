import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { logout } from "@/actions/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="text-lg font-bold tracking-tight">
              dhp都市開発GP
            </span>
            <span className="hidden text-sm text-gray-500 sm:inline">
              プロジェクト情報データベース
            </span>
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/" className="text-gray-700 hover:text-blue-600">
              一覧
            </Link>
            <Link
              href="/projects/new"
              className="text-gray-700 hover:text-blue-600"
            >
              ＋新規
            </Link>
            {user.role === "admin" && (
              <Link
                href="/admin"
                className="text-gray-700 hover:text-blue-600"
              >
                管理者
              </Link>
            )}
            <span className="hidden text-gray-400 sm:inline">|</span>
            <span className="hidden text-gray-600 sm:inline">
              {user.employeeId}
              {user.role === "admin" && (
                <span className="ml-1 rounded bg-purple-100 px-1.5 py-0.5 text-xs text-purple-700">
                  管理者
                </span>
              )}
            </span>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-md border border-gray-300 px-2.5 py-1 text-gray-700 hover:bg-gray-100"
              >
                ログアウト
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>

      <footer className="border-t border-gray-200 py-6 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} dhp都市開発グループ ／ 社内専用
      </footer>
    </div>
  );
}
