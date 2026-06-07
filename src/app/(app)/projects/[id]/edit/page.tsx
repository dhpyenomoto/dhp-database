import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { updateProject } from "@/actions/projects";
import ProjectForm from "@/components/ProjectForm";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) notFound();

  const action = updateProject.bind(null, id);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/" className="hover:underline">
          一覧
        </Link>
        <span>/</span>
        <Link href={`/projects/${id}`} className="hover:underline">
          {project.name}
        </Link>
        <span>/</span>
        <span>編集</span>
      </div>
      <h1 className="text-xl font-bold">プロジェクト編集</h1>
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <ProjectForm
          action={action}
          isEdit
          submitLabel="更新を保存"
          cancelHref={`/projects/${id}`}
          defaults={{
            projectNo: project.projectNo,
            status: project.status,
            name: project.name,
            category: project.category,
            summary: project.summary ?? "",
            owner: project.owner ?? "",
            infoRoute: project.infoRoute ?? "",
            approach: project.approach ?? "",
            landSize: project.landSize ?? "",
            buildingSize: project.buildingSize ?? "",
            buildingType: project.buildingType ?? "",
            priceSummary: project.priceSummary ?? "",
          }}
        />
      </div>
    </div>
  );
}
