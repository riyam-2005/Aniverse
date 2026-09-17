import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/core/clients/supabase-middleware";

const BLOCKED_PATHS = [
  "/.env",
  "/wp-admin",
  "/.git",
  "/xmlrpc.php",
  "/phpinfo",
  "/admin.php",
];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname.toLowerCase();

  // Edge Pre-Filtering: drop malicious scanner probes immediately
  if (BLOCKED_PATHS.some((probe) => pathname.startsWith(probe))) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const response = await updateSession(request);
  response.headers.set("x-aniverse-edge", "1");
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions (.svg, .png, .jpg, .jpeg, .gif, .webp, .ico)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
