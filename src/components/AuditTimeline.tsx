import { formatJst } from "@/lib/datetime";

export interface AuditView {
  id: string;
  entityType: string;
  action: string;
  fieldChanges: string | null;
  actorId: string;
  createdAt: string;
}

const ACTION_LABEL: Record<string, string> = {
  create: "作成",
  update: "更新",
  delete: "削除",
  restore: "復元",
};

const ENTITY_LABEL: Record<string, string> = {
  project: "プロジェクト",
  progressEntry: "進捗ログ",
  projectResource: "資料",
};

const ACTION_CLASS: Record<string, string> = {
  create: "bg-emerald-100 text-emerald-700",
  update: "bg-blue-100 text-blue-700",
  delete: "bg-red-100 text-red-700",
  restore: "bg-amber-100 text-amber-700",
};

function display(v: unknown): string {
  if (v === null || v === undefined || v === "") return "（空）";
  return String(v);
}

function renderChanges(raw: string | null) {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  // 差分配列 [{ field, label, before, after }]
  if (Array.isArray(parsed)) {
    return (
      <ul className="mt-1 space-y-0.5 text-xs text-gray-600">
        {parsed.map((c: { label?: string; field?: string; before?: unknown; after?: unknown }, i) => (
          <li key={i}>
            <span className="font-medium">{c.label ?? c.field}</span>:{" "}
            <span className="text-gray-400 line-through">
              {display(c.before)}
            </span>{" "}
            → <span className="text-gray-800">{display(c.after)}</span>
          </li>
        ))}
      </ul>
    );
  }

  // オブジェクト（作成時の主要値など）
  if (parsed && typeof parsed === "object") {
    const obj = parsed as Record<string, unknown>;
    return (
      <ul className="mt-1 space-y-0.5 text-xs text-gray-500">
        {Object.entries(obj).map(([k, v]) => (
          <li key={k}>
            {k}: {display(v)}
          </li>
        ))}
      </ul>
    );
  }
  return null;
}

export default function AuditTimeline({ logs }: { logs: AuditView[] }) {
  if (logs.length === 0) {
    return <p className="text-sm text-gray-400">変更履歴はまだありません。</p>;
  }
  return (
    <ol className="space-y-3">
      {logs.map((log) => (
        <li
          key={log.id}
          className="rounded-lg border border-gray-200 bg-white p-3"
        >
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span
              className={`rounded px-1.5 py-0.5 font-medium ${
                ACTION_CLASS[log.action] ?? "bg-gray-100 text-gray-700"
              }`}
            >
              {ENTITY_LABEL[log.entityType] ?? log.entityType}を
              {ACTION_LABEL[log.action] ?? log.action}
            </span>
            <span className="font-medium text-gray-700">{log.actorId}</span>
            <span>{formatJst(log.createdAt)}</span>
          </div>
          {renderChanges(log.fieldChanges)}
        </li>
      ))}
    </ol>
  );
}
