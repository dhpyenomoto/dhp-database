import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { formatJst } from "@/lib/datetime";
import StatusBadge from "@/components/StatusBadge";
import ProgressSection, {
  type ProgressEntryView,
} from "@/components/ProgressSection";
import AuditTimeline, { type AuditView } from "@/components/AuditTimeline";
import DeleteProjectButton from "@/components/DeleteProjectButton";

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="border-b border-gray-100 py-2">
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-wrap text-sm text-gray-800">
        {value ? value : <span className="text-gray-300">—</span>}
      </dd>
    </div>
  );
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      progressEntries: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!project) notFound();

  const entryIds = project.progressEntries.map((e) => e.id);
  const logs = await prisma.auditLog.findMany({
    where: {
      OR: [
        { entityType: "project", entityId: id },
        { entityType: "progressEntry", entityId: { in: entryIds } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  const isAdmin = user.role === "admin";

  const entryViews: ProgressEntryView[] = project.progressEntries.map((e) => ({
    id: e.id,
    body: e.body,
    authorId: e.authorId,
    createdAt: e.createdAt.toISOString(),
    editedById: e.editedById,
    editedAt: e.editedAt ? e.editedAt.toISOString() : null,
    isDeleted: e.isDeleted,
    deletedById: e.deletedById,
    deletedAt: e.deletedAt ? e.deletedAt.toISOString() : null,
  }));

  const logViews: AuditView[] = logs.map((l) => ({
    id: l.id,
    entityType: l.entityType,
    action: l.action,
    fieldChanges: l.fieldChanges,
    actorId: l.actorId,
    createdAt: l.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/" className="hover:underline">
          一覧
        </Link>
        <span>/</span>
        <span className="font-mono text-xs">{project.projectNo}</span>
      </div>

      {project.isDeleted && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          このプロジェクトは削除済みです（削除: {project.deletedById}・
          {formatJst(project.deletedAt)}）。管理者が復元できます。
        </div>
      )}

      {/* ヘッダー */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <StatusBadge status={project.status} />
            <span className="font-mono text-xs text-gray-400">
              {project.projectNo}
            </span>
          </div>
          <h1
            className={`text-2xl font-bold ${
              project.isDeleted ? "text-gray-400 line-through" : ""
            }`}
          >
            {project.name}
          </h1>
          <div className="text-xs text-gray-500">
            <span>
              作成: {project.createdById}・{formatJst(project.createdAt)}
            </span>
            <span className="mx-2">/</span>
            <span>
              最終更新: {project.updatedById}・{formatJst(project.updatedAt)}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/projects/${id}/edit`}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            編集
          </Link>
          {!project.isDeleted && <DeleteProjectButton id={id} />}
        </div>
      </div>

      {/* 項目（指定順） */}
      <section>
        <h2 className="mb-2 text-lg font-bold">プロジェクト情報</h2>
        <dl className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
          <Field label="区分" value={project.category} />
          <Field label="担当者名" value={project.owner} />
          <Field label="情報ルート" value={project.infoRoute} />
          <Field label="取組方針" value={project.approach} />
          <Field label="土地規模" value={project.landSize} />
          <Field label="建物規模" value={project.buildingSize} />
          <Field label="建物種別" value={project.buildingType} />
          <Field label="価格概要" value={project.priceSummary} />
        </dl>
        <div className="mt-2">
          <Field label="概要" value={project.summary} />
        </div>
      </section>

      {/* プロジェクトの現状（進捗ログ） */}
      <ProgressSection
        projectId={id}
        entries={entryViews}
        isAdmin={isAdmin}
      />

      {/* 変更履歴（監査ログ） */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold">変更履歴</h2>
        <AuditTimeline logs={logViews} />
      </section>
    </div>
  );
}
