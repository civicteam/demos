import { getPendingAuth } from "@/lib/ai/civic-rest-auth";
import { NextResponse } from "next/server";
import { getUser } from "@civic/auth/nextjs";

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ status: "none" }, { status: 401 });
  }

  const userId = user.id || user.email || "unknown";
  const pending = getPendingAuth(userId);
  if (pending) {
    return NextResponse.json({ status: "pending", authUrl: pending.authUrl });
  }

  return NextResponse.json({ status: "none" });
}
