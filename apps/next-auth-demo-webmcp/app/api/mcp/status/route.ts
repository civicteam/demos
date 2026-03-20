import { auth } from "@/auth";
import { cookies } from "next/headers";
import { CivicMcpClient } from "@civic/mcp-client";

export interface McpStatusResponse {
  authenticated: boolean;
  tokenExchange: {
    status: "success" | "failed" | "pending";
    error?: string;
    accessToken?: string;
  };
}

async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionToken =
    cookieStore.get("authjs.session-token")?.value ??
    cookieStore.get("__Secure-authjs.session-token")?.value;
  return sessionToken ?? null;
}

export async function GET(): Promise<Response> {
  const status: McpStatusResponse = {
    authenticated: false,
    tokenExchange: { status: "pending" },
  };

  try {
    const session = await auth();
    status.authenticated = !!session?.user;
    if (!status.authenticated) return Response.json(status);

    const clientId = process.env.CIVIC_CLIENT_ID;
    const clientSecret = process.env.CIVIC_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      status.tokenExchange = { status: "failed", error: "CIVIC_CLIENT_ID and CIVIC_CLIENT_SECRET are required" };
      return Response.json(status);
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

      const accessToken = await client.getConfig().resolveToken();
      status.tokenExchange = { status: "success", accessToken };
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      status.tokenExchange = { status: "failed", error: msg };
    }

    return Response.json(status);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ ...status, tokenExchange: { status: "failed", error: msg } });
  }
}
