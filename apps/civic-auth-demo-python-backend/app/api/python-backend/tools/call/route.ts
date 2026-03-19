import { getTokens, getUser } from "@civic/auth/nextjs";
import { NextResponse } from "next/server";

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL ?? "http://localhost:8000";

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tokens = await getTokens();
  const accessToken = tokens?.accessToken;
  if (!accessToken) {
    return NextResponse.json({ error: "Missing access token" }, { status: 401 });
  }

  const body = (await req.json()) as {
    toolName?: string;
    args?: Record<string, unknown>;
  };

  if (!body.toolName) {
    return NextResponse.json({ error: "toolName is required" }, { status: 400 });
  }

  const pythonRes = await fetch(`${PYTHON_BACKEND_URL}/tools/call`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify({
      name: body.toolName,
      args: body.args ?? {},
    }),
  });

  const data = await pythonRes.json().catch(async () => ({ raw: await pythonRes.text() }));
  return NextResponse.json(data, { status: pythonRes.status });
}

