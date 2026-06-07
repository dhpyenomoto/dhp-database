import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

// 未ログインユーザーはどのデータにもアクセスできない（/login のみ許可）
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  // ログイン画面
  if (pathname === "/login") {
    if (session) {
      // ログイン済みならトップへ
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  // それ以外は要ログイン
  if (!session) {
    const url = new URL("/login", req.url);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // 静的アセット・画像最適化・favicon を除く全ルートに適用
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
