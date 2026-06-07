"use client";

import { deleteProject } from "@/actions/projects";

export default function DeleteProjectButton({ id }: { id: string }) {
  return (
    <form
      action={deleteProject.bind(null, id)}
      onSubmit={(e) => {
        if (
          !confirm(
            "このプロジェクトを削除しますか？\n（物理削除ではなく、取り消し線で残ります。管理者が復元できます）"
          )
        )
          e.preventDefault();
      }}
    >
      <button
        type="submit"
        className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
      >
        削除
      </button>
    </form>
  );
}
