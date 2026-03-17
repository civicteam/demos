import { auth } from "@/auth";
import { getPendingAuth } from "@/lib/ai/civic-rest-auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ status: "none" }, { status: 401 });
  }

  const pending = getPendingAuth(session.user.id);
  if (pending) {
    return NextResponse.json({ status: "pending", authUrl: pending.authUrl });
  }

  return NextResponse.json({ status: "none" });
}
