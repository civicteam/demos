import { getTokens, getUser } from "@civic/auth/nextjs";
import { NextResponse } from "next/server";

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL ?? "http://localhost:8000";

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tokens = await getTokens();
  const accessToken = tokens?.accessToken;
  if (!accessToken) {
    return NextResponse.json({ error: "Missing access token" }, { status: 401 });
  }

  const pythonRes = await fetch(`${PYTHON_BACKEND_URL}/health`, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  const data = await pythonRes.json().catch(async () => ({ raw: await pythonRes.text() }));
  return NextResponse.json(data, { status: pythonRes.status });
}

