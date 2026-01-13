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
  mcp: {
    connected: boolean;
    toolCount?: number;
    error?: string;
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
    mcp: { connected: false },
  };

  try {
    // Check authentication
    const session = await auth();
    status.authenticated = !!session?.user;

    if (!status.authenticated) {
      return Response.json(status);
    }

    // Try token exchange
    const sessionToken = await getSessionToken();
    if (!sessionToken) {
      status.tokenExchange = { status: "failed", error: "No session token" };
      return Response.json(status);
    }

    try {
      const civicToken = await exchangeTokenForCivic(sessionToken);
      status.tokenExchange = { status: "success", accessToken: civicToken.accessToken };

      // Try to connect to MCP
      const mcpServerUrl = process.env.MCP_SERVER_URL;
      if (!mcpServerUrl) {
        status.mcp = { connected: false, error: "MCP_SERVER_URL not configured" };
        return Response.json(status);
      }

      // Simple connectivity check - just verify the server is reachable and auth works
      // We use GET which returns the MCP protocol metadata
      try {
        const mcpResponse = await fetch(mcpServerUrl, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${civicToken.accessToken}`,
            "x-civic-profile": "default",
          },
        });

        if (mcpResponse.ok) {
          status.mcp = {
            connected: true,
          };
        } else if (mcpResponse.status === 401) {
          const errorText = await mcpResponse.text();
          status.mcp = {
            connected: false,
            error: `Auth failed: ${errorText.slice(0, 100)}`,
          };
        } else {
          status.mcp = {
            connected: true, // Server is reachable, might just be returning non-200 for GET
          };
        }
      } catch (mcpError) {
        const mcpErrorMessage = mcpError instanceof Error ? mcpError.message : "Unknown error";
        status.mcp = {
          connected: false,
          error: mcpErrorMessage.includes("ECONNREFUSED")
            ? "MCP Hub not running"
            : mcpErrorMessage,
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      status.tokenExchange = { status: "failed", error: errorMessage };
      status.mcp = { connected: false, error: "Token exchange failed" };
    }

    return Response.json(status);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return Response.json({
      ...status,
      tokenExchange: { status: "failed", error: errorMessage },
    });
  }
}
