"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

// 資料リンクの入力スキーマ
const resourceSchema = z.object({
  title: z.string().trim().min(1, "資料名を入力してください。").max(200),
  // http / https のURLのみ許可（Dropbox 等の共有リンク）
  url: z
    .string()
    .trim()
    .min(1, "リンク（URL）を入力してください。")
    .max(2000)
    .url("正しいURLを入力してください（https:// から始まる形式）。")
    .refine(
      (v) => /^https?:\/\//i.test(v),
      "URLは http:// または https:// で始めてください。"
    ),
  note: z.string().trim().max(1000).optional().default(""),
});

export interface ResourceState {
  error?: string;
}

/** 資料リンクを追加（IDを持つ社員なら誰でも可） */
export async function addResource(
  projectId: string,
  _prev: ResourceState,
  formData: FormData
): Promise<ResourceState> {
  const user = await requireUser();
  const parsed = resourceSchema.safeParse({
    title: formData.get("title") ?? "",
    url: formData.get("url") ?? "",
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "入力に誤りがあります。",
    };
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return { error: "対象のプロジェクトが見つかりません。" };

  const resource = await prisma.projectResource.create({
    data: {
      projectId,
      title: parsed.data.title,
      url: parsed.data.url,
      note: parsed.data.note || null,
      createdById: user.employeeId,
    },
  });

  await recordAudit({
    entityType: "projectResource",
    entityId: resource.id,
    action: "create",
    actorId: user.employeeId,
    changes: { title: parsed.data.title, url: parsed.data.url },
  });

  revalidatePath(`/projects/${projectId}`);
  return {};
}

/** 資料リンクの論理削除（誤削除に備え、管理者が復元できる） */
export async function deleteResource(resourceId: string) {
  const user = await requireUser();
  const resource = await prisma.projectResource.findUnique({
    where: { id: resourceId },
  });
  if (!resource || resource.isDeleted) return;

  await prisma.projectResource.update({
    where: { id: resourceId },
    data: {
      isDeleted: true,
      deletedById: user.employeeId,
      deletedAt: new Date(),
    },
  });

  await recordAudit({
    entityType: "projectResource",
    entityId: resourceId,
    action: "delete",
    actorId: user.employeeId,
    changes: { title: resource.title },
  });

  revalidatePath(`/projects/${resource.projectId}`);
}

/** 資料リンクの復元（管理者のみ） */
export async function restoreResource(resourceId: string) {
  const user = await requireUser();
  if (user.role !== "admin") return;
  const resource = await prisma.projectResource.findUnique({
    where: { id: resourceId },
  });
  if (!resource || !resource.isDeleted) return;

  await prisma.projectResource.update({
    where: { id: resourceId },
    data: { isDeleted: false, deletedById: null, deletedAt: null },
  });

  await recordAudit({
    entityType: "projectResource",
    entityId: resourceId,
    action: "restore",
    actorId: user.employeeId,
    changes: { title: resource.title },
  });

  revalidatePath(`/projects/${resource.projectId}`);
}
