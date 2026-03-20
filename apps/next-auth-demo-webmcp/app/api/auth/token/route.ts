import { auth } from "@/auth";
import { cookies } from "next/headers";
import { CivicMcpClient } from "@civic/mcp-client";

async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionToken =
    cookieStore.get("authjs.session-token")?.value ??
    cookieStore.get("__Secure-authjs.session-token")?.value;
  return sessionToken ?? null;
}

export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const clientId = process.env.CIVIC_CLIENT_ID;
  const clientSecret = process.env.CIVIC_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return Response.json({ error: "CIVIC_CLIENT_ID and CIVIC_CLIENT_SECRET are required" }, { status: 500 });
  }

  try {
    const client = new CivicMcpClient({
      auth: {
        tokenExchange: {
          clientId,
          clientSecret,
          subjectToken: getSessionToken as () => Promise<string>,
        },
      },
      civicProfile: process.env.CIVIC_PROFILE_ID,
    });

    const config = client.getConfig();
    const accessToken = await config.resolveToken();
    const mcpUrl = config.url;

    return Response.json({
      accessToken,
      mcpUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Token exchange failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
