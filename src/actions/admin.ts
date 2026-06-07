"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const createUserSchema = z.object({
  employeeId: z
    .string()
    .trim()
    .min(1, "社員IDは必須です。")
    .max(50)
    .regex(/^[A-Za-z0-9_-]+$/, "社員IDは英数字・ハイフン・アンダースコアのみ。"),
  name: z.string().trim().max(100).optional().default(""),
  password: z.string().min(8, "パスワードは8文字以上にしてください。").max(200),
  role: z.enum(["member", "admin"]),
});

export interface AdminUserState {
  error?: string;
  success?: string;
}

/** 社員アカウントの発行（管理者のみ） */
export async function createUser(
  _prev: AdminUserState,
  formData: FormData
): Promise<AdminUserState> {
  await requireAdmin();

  const parsed = createUserSchema.safeParse({
    employeeId: formData.get("employeeId"),
    name: formData.get("name") || "",
    password: formData.get("password"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力に誤りがあります。" };
  }
  const { employeeId, name, password, role } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { employeeId } });
  if (exists) {
    return { error: `社員ID「${employeeId}」は既に存在します。` };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { employeeId, name: name || null, passwordHash, role },
  });

  revalidatePath("/admin");
  return { success: `社員ID「${employeeId}」を発行しました。` };
}

/** 社員アカウントの有効化／無効化（管理者のみ） */
export async function setUserActive(userId: string, isActive: boolean) {
  const admin = await requireAdmin();
  // 自分自身の無効化は防止
  if (admin.id === userId && !isActive) return;

  await prisma.user.update({ where: { id: userId }, data: { isActive } });
  revalidatePath("/admin");
}

/** パスワード再設定（管理者のみ） */
export async function resetPassword(
  _prev: AdminUserState,
  formData: FormData
): Promise<AdminUserState> {
  await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) {
    return { error: "パスワードは8文字以上にしてください。" };
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "対象の社員が見つかりません。" };

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  revalidatePath("/admin");
  return { success: `社員ID「${user.employeeId}」のパスワードを再設定しました。` };
}
