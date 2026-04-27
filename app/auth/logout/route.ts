import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";
import { destroySession, getSessionCookieName, clearSessionCookieHeader } from "@/lib/auth/internalAuth";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(getSessionCookieName())?.value ?? null;

  if (sessionCookie) {
    await destroySession(sessionCookie, supabaseServer);
  }

  const url = new URL(req.url);
  const res = NextResponse.redirect(new URL("/login", url.origin));
  res.headers.set("Set-Cookie", clearSessionCookieHeader());
  return res;
}
