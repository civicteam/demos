import { auth } from "@/auth";
import { cookies } from "next/headers";
import { exchangeTokenForCivic } from "@/lib/token-exchange";

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

    const sessionToken = await getSessionToken();
    if (!sessionToken) {
      status.tokenExchange = { status: "failed", error: "No session token" };
      return Response.json(status);
    }

    try {
      const civicToken = await exchangeTokenForCivic(sessionToken);
      status.tokenExchange = { status: "success", accessToken: civicToken.accessToken };
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
