import { auth } from "@/auth";
import { cookies } from "next/headers";
import { exchangeTokenForCivic } from "@/lib/token-exchange";

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

  const sessionToken = await getSessionToken();
  if (!sessionToken) {
    return Response.json({ error: "No session token" }, { status: 401 });
  }

  try {
    const civicToken = await exchangeTokenForCivic(sessionToken);
    return Response.json({
      accessToken: civicToken.accessToken,
      mcpUrl: process.env.MCP_SERVER_URL,
      expiresAt: civicToken.expiresAt.toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Token exchange failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
