import { getPendingAuth } from "@/lib/ai/civic-rest-auth";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

async function getSessionUser(): Promise<{ id: string } | null> {
  try {
    const headersList = await headers();
    const cookie = headersList.get("cookie") || "";
    const res = await fetch(`${process.env.BETTER_AUTH_URL || "http://localhost:3023"}/api/auth/get-session`, {
      headers: { cookie },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.user ? { id: data.user.id } : null;
  } catch {
    return null;
  }
}

export async function GET() {
  const user = await getSessionUser();
  if (!user?.id) {
    return NextResponse.json({ status: "none" }, { status: 401 });
  }

  const pending = getPendingAuth(user.id);
  if (pending) {
    return NextResponse.json({ status: "pending", authUrl: pending.authUrl });
  }

  return NextResponse.json({ status: "none" });
}
