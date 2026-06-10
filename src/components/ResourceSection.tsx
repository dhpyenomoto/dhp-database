"use client";

import { useActionState, useState } from "react";
import {
  addResource,
  deleteResource,
  restoreResource,
  type ResourceState,
} from "@/actions/resources";
import { formatJst } from "@/lib/datetime";

export interface ResourceView {
  id: string;
  title: string;
  url: string;
  note: string | null;
  createdById: string;
  createdAt: string;
  isDeleted: boolean;
  deletedById: string | null;
  deletedAt: string | null;
}

const inputCls =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

function AddForm({ projectId }: { projectId: string }) {
  const boundAdd = addResource.bind(null, projectId);
  const [state, formAction, pending] = useActionState<ResourceState, FormData>(
    boundAdd,
    {}
  );
  return (
    <form action={formAction} className="space-y-2">
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input
          name="title"
          required
          maxLength={200}
          placeholder="資料名（例: 土地登記簿、現地写真）"
          className={inputCls}
        />
        <input
          name="url"
          type="url"
          required
          maxLength={2000}
          placeholder="リンク（https://www.dropbox.com/...）"
          className={inputCls}
        />
      </div>
      <input
        name="note"
        maxLength={1000}
        placeholder="補足メモ（任意）"
        className={inputCls}
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {pending ? "追加中…" : "資料リンクを追加"}
      </button>
    </form>
  );
}

function ResourceItem({
  resource,
  isAdmin,
}: {
  resource: ResourceView;
  isAdmin: boolean;
}) {
  return (
    <li className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-gray-200 bg-white p-3">
      <div className="min-w-0 flex-1">
        {resource.isDeleted ? (
          <span className="text-sm font-medium text-gray-400 line-through">
            {resource.title}
          </span>
        ) : (
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
          >
            <span aria-hidden>🔗</span>
            <span className="break-all">{resource.title}</span>
          </a>
        )}
        {resource.note && !resource.isDeleted && (
          <p className="mt-0.5 text-xs text-gray-600">{resource.note}</p>
        )}
        <p className="mt-0.5 truncate text-xs text-gray-400">{resource.url}</p>
        <p className="mt-0.5 text-xs text-gray-400">
          登録: {resource.createdById}・{formatJst(resource.createdAt)}
          {resource.isDeleted && (
            <span className="ml-2 text-red-500">
              （削除: {resource.deletedById}・{formatJst(resource.deletedAt)}）
            </span>
          )}
        </p>
      </div>
      <div className="shrink-0 text-xs">
        {!resource.isDeleted ? (
          <form
            action={deleteResource.bind(null, resource.id)}
            onSubmit={(e) => {
              if (!confirm("この資料リンクを削除しますか？\n（管理者が復元できます）"))
                e.preventDefault();
            }}
          >
            <button type="submit" className="text-red-600 hover:underline">
              削除
            </button>
          </form>
        ) : (
          isAdmin && (
            <form action={restoreResource.bind(null, resource.id)}>
              <button type="submit" className="text-emerald-600 hover:underline">
                復元
              </button>
            </form>
          )
        )}
      </div>
    </li>
  );
}

export default function ResourceSection({
  projectId,
  resources,
  isAdmin,
}: {
  projectId: string;
  resources: ResourceView[];
  isAdmin: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const active = resources.filter((r) => !r.isDeleted);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">
          資料{" "}
          <span className="text-sm font-normal text-gray-400">
            （{active.length}件）
          </span>
        </h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md border border-blue-300 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50"
        >
          {showForm ? "閉じる" : "＋資料リンクを追加"}
        </button>
      </div>

      <p className="text-xs text-gray-500">
        Dropbox や Google Drive
        などの共有リンクを登録できます。ファイル本体は各サービスに置き、ここにはリンクのみ保存されます。
      </p>

      {showForm && (
        <div className="rounded-lg border border-blue-100 bg-blue-50/40 p-4">
          <AddForm projectId={projectId} />
        </div>
      )}

      {resources.length === 0 ? (
        <p className="text-sm text-gray-400">
          まだ資料がありません。「＋資料リンクを追加」から登録できます。
        </p>
      ) : (
        <ul className="space-y-2">
          {resources.map((r) => (
            <ResourceItem key={r.id} resource={r} isAdmin={isAdmin} />
          ))}
        </ul>
      )}
    </section>
  );
}
