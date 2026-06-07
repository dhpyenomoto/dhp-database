"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { recordAudit, diffFields } from "@/lib/audit";
import {
  PROJECT_STATUSES,
  CATEGORIES,
  APPROACHES,
  BUILDING_TYPES,
} from "@/lib/masters";

// プロジェクト本体の入力スキーマ（サーバー側バリデーション）
const projectSchema = z.object({
  projectNo: z.string().trim().max(50).optional(),
  status: z.enum(PROJECT_STATUSES),
  name: z.string().trim().min(1, "プロジェクト名称は必須です。").max(200),
  category: z.enum(CATEGORIES),
  summary: z.string().trim().max(5000).optional().default(""),
  owner: z.string().trim().max(100).optional().default(""),
  infoRoute: z.string().trim().max(200).optional().default(""),
  approach: z.union([z.enum(APPROACHES), z.literal("")]).optional().default(""),
  landSize: z.string().trim().max(200).optional().default(""),
  buildingSize: z.string().trim().max(200).optional().default(""),
  buildingType: z
    .union([z.enum(BUILDING_TYPES), z.literal("")])
    .optional()
    .default(""),
  priceSummary: z.string().trim().max(200).optional().default(""),
});

const TRACKED_FIELDS = [
  "projectNo",
  "status",
  "name",
  "category",
  "summary",
  "owner",
  "infoRoute",
  "approach",
  "landSize",
  "buildingSize",
  "buildingType",
  "priceSummary",
];

export interface ProjectFormState {
  error?: string;
}

/** P-#### 形式の次の番号を自動採番する */
async function nextProjectNo(): Promise<string> {
  const projects = await prisma.project.findMany({
    select: { projectNo: true },
  });
  let max = 0;
  for (const p of projects) {
    const m = /^P-(\d+)$/.exec(p.projectNo);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `P-${String(max + 1).padStart(4, "0")}`;
}

function parseForm(formData: FormData) {
  return projectSchema.safeParse({
    projectNo: formData.get("projectNo") || undefined,
    status: formData.get("status"),
    name: formData.get("name"),
    category: formData.get("category"),
    summary: formData.get("summary") || "",
    owner: formData.get("owner") || "",
    infoRoute: formData.get("infoRoute") || "",
    approach: formData.get("approach") || "",
    landSize: formData.get("landSize") || "",
    buildingSize: formData.get("buildingSize") || "",
    buildingType: formData.get("buildingType") || "",
    priceSummary: formData.get("priceSummary") || "",
  });
}

export async function createProject(
  _prev: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  const user = await requireUser();
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力に誤りがあります。" };
  }
  const data = parsed.data;

  // プロジェクトNO.: 手動指定があれば一意性チェック、なければ自動採番
  let projectNo = data.projectNo?.trim();
  if (projectNo) {
    const exists = await prisma.project.findUnique({ where: { projectNo } });
    if (exists) {
      return { error: `プロジェクトNO.「${projectNo}」は既に使用されています。` };
    }
  } else {
    projectNo = await nextProjectNo();
  }

  let created;
  try {
    created = await prisma.project.create({
      data: {
        projectNo,
        status: data.status,
        name: data.name,
        category: data.category,
        summary: data.summary || null,
        owner: data.owner || null,
        infoRoute: data.infoRoute || null,
        approach: data.approach || null,
        landSize: data.landSize || null,
        buildingSize: data.buildingSize || null,
        buildingType: data.buildingType || null,
        priceSummary: data.priceSummary || null,
        createdById: user.employeeId,
        updatedById: user.employeeId,
      },
    });
  } catch {
    return { error: "保存に失敗しました。プロジェクトNO.の重複の可能性があります。" };
  }

  await recordAudit({
    entityType: "project",
    entityId: created.id,
    action: "create",
    actorId: user.employeeId,
    changes: { projectNo, name: data.name },
  });

  revalidatePath("/");
  redirect(`/projects/${created.id}`);
}

export async function updateProject(
  id: string,
  _prev: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  const user = await requireUser();
  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) return { error: "対象のプロジェクトが見つかりません。" };

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力に誤りがあります。" };
  }
  const data = parsed.data;

  // プロジェクトNO.変更時の一意性チェック
  const newProjectNo = data.projectNo?.trim() || existing.projectNo;
  if (newProjectNo !== existing.projectNo) {
    const dup = await prisma.project.findUnique({
      where: { projectNo: newProjectNo },
    });
    if (dup) {
      return { error: `プロジェクトNO.「${newProjectNo}」は既に使用されています。` };
    }
  }

  const after = {
    projectNo: newProjectNo,
    status: data.status,
    name: data.name,
    category: data.category,
    summary: data.summary || null,
    owner: data.owner || null,
    infoRoute: data.infoRoute || null,
    approach: data.approach || null,
    landSize: data.landSize || null,
    buildingSize: data.buildingSize || null,
    buildingType: data.buildingType || null,
    priceSummary: data.priceSummary || null,
  };

  const changes = diffFields(
    existing as unknown as Record<string, unknown>,
    after,
    TRACKED_FIELDS
  );

  // 変更が無ければ何もしない
  if (changes.length === 0) {
    redirect(`/projects/${id}`);
  }

  await prisma.project.update({
    where: { id },
    data: { ...after, updatedById: user.employeeId },
  });

  await recordAudit({
    entityType: "project",
    entityId: id,
    action: "update",
    actorId: user.employeeId,
    changes,
  });

  revalidatePath("/");
  revalidatePath(`/projects/${id}`);
  redirect(`/projects/${id}`);
}

/** 論理削除（物理削除しない） */
export async function deleteProject(id: string) {
  const user = await requireUser();
  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing || existing.isDeleted) return;

  await prisma.project.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedById: user.employeeId,
      deletedAt: new Date(),
      updatedById: user.employeeId,
    },
  });

  await recordAudit({
    entityType: "project",
    entityId: id,
    action: "delete",
    actorId: user.employeeId,
  });

  revalidatePath("/");
  revalidatePath(`/projects/${id}`);
}

/** 論理削除の復元（管理者向けに admin から呼び出す） */
export async function restoreProject(id: string) {
  const user = await requireUser();
  if (user.role !== "admin") return;
  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing || !existing.isDeleted) return;

  await prisma.project.update({
    where: { id },
    data: {
      isDeleted: false,
      deletedById: null,
      deletedAt: null,
      updatedById: user.employeeId,
    },
  });

  await recordAudit({
    entityType: "project",
    entityId: id,
    action: "restore",
    actorId: user.employeeId,
  });

  revalidatePath("/");
  revalidatePath(`/projects/${id}`);
  revalidatePath("/admin");
}
