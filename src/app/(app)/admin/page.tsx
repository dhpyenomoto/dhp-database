import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { formatJst } from "@/lib/datetime";
import { restoreProject } from "@/actions/projects";
import { restoreProgress } from "@/actions/progress";
import AdminUsers, { type UserView } from "@/components/AdminUsers";

export default async function AdminPage() {
  const admin = await requireAdmin();

  const [users, deletedProjects, deletedEntries] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.project.findMany({
      where: { isDeleted: true },
      orderBy: { deletedAt: "desc" },
    }),
    prisma.progressEntry.findMany({
      where: { isDeleted: true },
      orderBy: { deletedAt: "desc" },
      include: { project: { select: { id: true, name: true, projectNo: true } } },
    }),
  ]);

  const userViews: UserView[] = users.map((u) => ({
    id: u.id,
    employeeId: u.employeeId,
    name: u.name,
    role: u.role,
    isActive: u.isActive,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-xl font-bold">管理者画面</h1>
        <p className="mt-1 text-sm text-gray-500">
          社員アカウントの発行・無効化、論理削除の復元を行えます。
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">社員アカウント</h2>
        <AdminUsers users={userViews} currentUserId={admin.id} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">削除済みプロジェクトの復元</h2>
        {deletedProjects.length === 0 ? (
          <p className="text-sm text-gray-400">削除済みのプロジェクトはありません。</p>
        ) : (
          <ul className="space-y-2">
            {deletedProjects.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3"
              >
                <div className="text-sm">
                  <Link
                    href={`/projects/${p.id}`}
                    className="font-medium text-gray-700 line-through hover:underline"
                  >
                    {p.projectNo} {p.name}
                  </Link>
                  <span className="ml-2 text-xs text-red-500">
                    削除: {p.deletedById}・{formatJst(p.deletedAt)}
                  </span>
                </div>
                <form action={restoreProject.bind(null, p.id)}>
                  <button
                    type="submit"
                    className="rounded-md border border-emerald-300 px-3 py-1 text-sm text-emerald-700 hover:bg-emerald-50"
                  >
                    復元
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">削除済み進捗ログの復元</h2>
        {deletedEntries.length === 0 ? (
          <p className="text-sm text-gray-400">削除済みの進捗ログはありません。</p>
        ) : (
          <ul className="space-y-2">
            {deletedEntries.map((e) => (
              <li
                key={e.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3"
              >
                <div className="text-sm">
                  <Link
                    href={`/projects/${e.project.id}`}
                    className="text-xs text-gray-500 hover:underline"
                  >
                    {e.project.projectNo} {e.project.name}
                  </Link>
                  <p className="text-gray-600 line-through">{e.body}</p>
                  <span className="text-xs text-red-500">
                    削除: {e.deletedById}・{formatJst(e.deletedAt)}
                  </span>
                </div>
                <form action={restoreProgress.bind(null, e.id)}>
                  <button
                    type="submit"
                    className="rounded-md border border-emerald-300 px-3 py-1 text-sm text-emerald-700 hover:bg-emerald-50"
                  >
                    復元
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
