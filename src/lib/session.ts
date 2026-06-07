import { SignJWT, jwtVerify } from "jose";

// 自前の軽量セッション（jose による署名付き JWT を Cookie に保存）。
// 外部の認証ライブラリ（beta含む）に依存せず、挙動を完全に制御する。

export const SESSION_COOKIE = "dhpdb_session";
const MAX_AGE_SECONDS = 60 * 60 * 8; // 8時間

export interface SessionPayload {
  userId: string;
  employeeId: string;
  role: string;
  [key: string]: unknown;
}

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "AUTH_SECRET が未設定です。.env に十分な長さのランダム文字列を設定してください。"
    );
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(
  payload: SessionPayload
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (
      typeof payload.userId === "string" &&
      typeof payload.employeeId === "string" &&
      typeof payload.role === "string"
    ) {
      return {
        userId: payload.userId,
        employeeId: payload.employeeId,
        role: payload.role,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export const SESSION_MAX_AGE = MAX_AGE_SECONDS;
