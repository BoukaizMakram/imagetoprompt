import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export function hasAuthCookieFromHeaders(): boolean {
  const store = cookies();
  return store.getAll().some(
    (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
  );
}

export function hasAuthCookieFromRequest(req: NextRequest): boolean {
  return req.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token"));
}
