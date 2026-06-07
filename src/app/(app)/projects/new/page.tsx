import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createProject } from "@/actions/projects";
import ProjectForm from "@/components/ProjectForm";

export default async function NewProjectPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/" className="hover:underline">
          一覧
        </Link>
        <span>/</span>
        <span>新規プロジェクト</span>
      </div>
      <h1 className="text-xl font-bold">新規プロジェクト</h1>
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <ProjectForm
          action={createProject}
          submitLabel="作成"
          cancelHref="/"
        />
      </div>
    </div>
  );
}
