import { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/account/:path*",
    "/api/account/:path*",
    "/api/generate",
    "/api/stripe/:path*",
    "/api/upload-url",
    "/auth/:path*",
    "/login",
  ],
};
