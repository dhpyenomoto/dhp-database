"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  createSessionToken,
} from "@/lib/session";

export interface LoginState {
  error?: string;
}

export async function login(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const employeeId = String(formData.get("employeeId") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!employeeId || !password) {
    return { error: "社員IDとパスワードを入力してください。" };
  }

  const user = await prisma.user.findUnique({ where: { employeeId } });
  // ユーザー不在・無効・パスワード不一致はすべて同一メッセージ（情報漏洩防止）
  const ok =
    user && user.isActive && (await bcrypt.compare(password, user.passwordHash));
  if (!user || !ok) {
    return { error: "社員IDまたはパスワードが正しくありません。" };
  }

  const token = await createSessionToken({
    userId: user.id,
    employeeId: user.employeeId,
    role: user.role,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  redirect("/");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
}
