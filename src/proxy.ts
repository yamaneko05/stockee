import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// 認証不要のパス（公開ルート）
const publicPaths = ["/login", "/signup"];

// 静的ファイルやAPIルートのパターン
const ignoredPaths = [
  "/api/auth", // Better Auth API
  "/_next",
  "/favicon.ico",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 静的ファイルやBetter Auth APIはスキップ
  if (ignoredPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // 公開ルートはスキップ
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // セッション確認
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // 未認証の場合はログインページにリダイレクト
  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 以下を除くすべてのパスにマッチ:
     * - _next/static (静的ファイル)
     * - _next/image (画像最適化)
     * - favicon.ico, sitemap.xml, robots.txt (メタデータファイル)
     */
    '/((?!api|_next/static|_next/image|.*\\.png$).*)',
  ],
};
