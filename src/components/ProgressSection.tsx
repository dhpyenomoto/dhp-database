"use client";

import { useActionState, useState } from "react";
import {
  addProgress,
  editProgress,
  deleteProgress,
  restoreProgress,
  type ProgressState,
} from "@/actions/progress";
import { formatJst } from "@/lib/datetime";

export interface ProgressEntryView {
  id: string;
  body: string;
  authorId: string;
  createdAt: string;
  editedById: string | null;
  editedAt: string | null;
  isDeleted: boolean;
  deletedById: string | null;
  deletedAt: string | null;
}

const taCls =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

function AddForm({ projectId }: { projectId: string }) {
  const boundAdd = addProgress.bind(null, projectId);
  const [state, formAction, pending] = useActionState<ProgressState, FormData>(
    boundAdd,
    {}
  );
  return (
    <form action={formAction} className="space-y-2">
      {state.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      <textarea
        name="body"
        rows={3}
        required
        placeholder="現状・進捗を追記…"
        className={taCls}
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {pending ? "追記中…" : "追記する"}
      </button>
    </form>
  );
}

function EntryItem({
  entry,
  isAdmin,
}: {
  entry: ProgressEntryView;
  isAdmin: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const boundEdit = editProgress.bind(null, entry.id);
  const [state, formAction, pending] = useActionState<ProgressState, FormData>(
    boundEdit,
    {}
  );

  return (
    <li className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
        <span>
          <span className="font-medium text-gray-700">{entry.authorId}</span>
          <span className="ml-2">{formatJst(entry.createdAt)}</span>
          {entry.editedAt && (
            <span className="ml-2 text-amber-600">
              （編集済み 最終: {entry.editedById}・{formatJst(entry.editedAt)}）
            </span>
          )}
        </span>
        {!entry.isDeleted && !editing && (
          <span className="flex gap-2">
            <button
              onClick={() => setEditing(true)}
              className="text-blue-600 hover:underline"
            >
              修正
            </button>
            <form
              action={deleteProgress.bind(null, entry.id)}
              onSubmit={(e) => {
                if (!confirm("この記載を削除しますか？（取り消し線で残ります）"))
                  e.preventDefault();
              }}
            >
              <button type="submit" className="text-red-600 hover:underline">
                削除
              </button>
            </form>
          </span>
        )}
        {entry.isDeleted && isAdmin && (
          <form action={restoreProgress.bind(null, entry.id)}>
            <button type="submit" className="text-emerald-600 hover:underline">
              復元
            </button>
          </form>
        )}
      </div>

      {editing ? (
        <form action={formAction} className="space-y-2">
          {state.error && (
            <p className="text-sm text-red-600">{state.error}</p>
          )}
          <textarea
            name="body"
            rows={3}
            required
            defaultValue={entry.body}
            className={taCls}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
            >
              保存
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-sm text-gray-500 hover:underline"
            >
              キャンセル
            </button>
          </div>
        </form>
      ) : (
        <p
          className={`whitespace-pre-wrap text-sm ${
            entry.isDeleted ? "text-gray-400 line-through" : "text-gray-800"
          }`}
        >
          {entry.body}
        </p>
      )}

      {entry.isDeleted && (
        <p className="mt-1 text-xs text-red-500">
          削除: {entry.deletedById}・{formatJst(entry.deletedAt)}
        </p>
      )}
    </li>
  );
}

export default function ProgressSection({
  projectId,
  entries,
  isAdmin,
}: {
  projectId: string;
  entries: ProgressEntryView[];
  isAdmin: boolean;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold">プロジェクトの現状</h2>

      <div className="rounded-lg border border-blue-100 bg-blue-50/40 p-4">
        <AddForm projectId={projectId} />
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-gray-400">まだ記載がありません。</p>
      ) : (
        <ul className="space-y-3">
          {entries.map((e) => (
            <EntryItem key={e.id} entry={e} isAdmin={isAdmin} />
          ))}
        </ul>
      )}
    </section>
  );
}
