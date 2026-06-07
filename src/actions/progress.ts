"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

const bodySchema = z
  .string()
  .trim()
  .min(1, "本文を入力してください。")
  .max(10000);

export interface ProgressState {
  error?: string;
}

/** 進捗ログを新規追記（IDを持つ社員なら誰でも可） */
export async function addProgress(
  projectId: string,
  _prev: ProgressState,
  formData: FormData
): Promise<ProgressState> {
  const user = await requireUser();
  const parsed = bodySchema.safeParse(formData.get("body") ?? "");
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力に誤りがあります。" };
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return { error: "対象のプロジェクトが見つかりません。" };

  const entry = await prisma.progressEntry.create({
    data: {
      projectId,
      body: parsed.data,
      authorId: user.employeeId,
    },
  });

  await recordAudit({
    entityType: "progressEntry",
    entityId: entry.id,
    action: "create",
    actorId: user.employeeId,
    changes: { projectId, body: parsed.data },
  });

  revalidatePath(`/projects/${projectId}`);
  return {};
}

/** 進捗ログの修正（履歴を残す。最終修正者・日時を保持） */
export async function editProgress(
  entryId: string,
  _prev: ProgressState,
  formData: FormData
): Promise<ProgressState> {
  const user = await requireUser();
  const parsed = bodySchema.safeParse(formData.get("body") ?? "");
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力に誤りがあります。" };
  }

  const entry = await prisma.progressEntry.findUnique({
    where: { id: entryId },
  });
  if (!entry || entry.isDeleted) {
    return { error: "対象の記載が見つかりません。" };
  }
  if (entry.body === parsed.data) return {};

  await prisma.progressEntry.update({
    where: { id: entryId },
    data: {
      body: parsed.data,
      editedById: user.employeeId,
      editedAt: new Date(),
    },
  });

  await recordAudit({
    entityType: "progressEntry",
    entityId: entryId,
    action: "update",
    actorId: user.employeeId,
    changes: [
      { field: "body", label: "本文", before: entry.body, after: parsed.data },
    ],
  });

  revalidatePath(`/projects/${entry.projectId}`);
  return {};
}

/** 進捗ログの論理削除（取り消し線で表示し続ける） */
export async function deleteProgress(entryId: string) {
  const user = await requireUser();
  const entry = await prisma.progressEntry.findUnique({
    where: { id: entryId },
  });
  if (!entry || entry.isDeleted) return;

  await prisma.progressEntry.update({
    where: { id: entryId },
    data: {
      isDeleted: true,
      deletedById: user.employeeId,
      deletedAt: new Date(),
    },
  });

  await recordAudit({
    entityType: "progressEntry",
    entityId: entryId,
    action: "delete",
    actorId: user.employeeId,
  });

  revalidatePath(`/projects/${entry.projectId}`);
}

/** 進捗ログの復元（管理者のみ） */
export async function restoreProgress(entryId: string) {
  const user = await requireUser();
  if (user.role !== "admin") return;
  const entry = await prisma.progressEntry.findUnique({
    where: { id: entryId },
  });
  if (!entry || !entry.isDeleted) return;

  await prisma.progressEntry.update({
    where: { id: entryId },
    data: { isDeleted: false, deletedById: null, deletedAt: null },
  });

  await recordAudit({
    entityType: "progressEntry",
    entityId: entryId,
    action: "restore",
    actorId: user.employeeId,
  });

  revalidatePath(`/projects/${entry.projectId}`);
  revalidatePath("/admin");
}
