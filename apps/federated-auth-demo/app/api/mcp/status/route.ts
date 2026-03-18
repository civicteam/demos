import { auth } from "@/auth";
import { getNexusClient } from "@/lib/ai/mcp";
import { debugAPI } from "@/lib/debug";

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

    // Try to get a Nexus client (handles token exchange internally)
    try {
      const client = await getNexusClient();

      if (!client) {
        debugAPI("[mcp/status] Could not create Nexus client");
        status.tokenExchange = { status: "failed", error: "Could not create Nexus client" };
        return Response.json(status);
      }

      // Resolve the token (triggers exchange if needed) so getAccessToken() is populated
      const token = await client.getConfig().resolveToken();

      status.tokenExchange = {
        status: "success",
        accessToken: client.getAccessToken(),
      };

      // Try to connect to MCP
      const mcpServerUrl = process.env.MCP_SERVER_URL;
      if (!mcpServerUrl) {
        status.mcp = { connected: false, error: "MCP_SERVER_URL not configured" };
        return Response.json(status);
      }

      // Simple connectivity check - just verify the server is reachable and auth works
      try {
        const mcpResponse = await fetch(mcpServerUrl, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "x-civic-profile": "default",
          },
        });

        const responseText = await mcpResponse.text();
        debugAPI("[mcp/status] MCP check response: %d %s", mcpResponse.status, responseText.slice(0, 200));

        if (mcpResponse.ok) {
          status.mcp = { connected: true };
        } else if (mcpResponse.status === 401) {
          status.mcp = {
            connected: false,
            error: `Auth failed: ${responseText.slice(0, 100)}`,
          };
        } else {
          status.mcp = { connected: true }; // Server is reachable
        }
      } catch (mcpError) {
        const mcpErrorMessage = mcpError instanceof Error ? mcpError.message : "Unknown error";
        debugAPI("[mcp/status] MCP connectivity check failed:", mcpErrorMessage);
        status.mcp = {
          connected: false,
          error: mcpErrorMessage.includes("ECONNREFUSED")
            ? "MCP Hub not running"
            : mcpErrorMessage,
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      debugAPI("[mcp/status] Token exchange failed:", errorMessage);
      status.tokenExchange = { status: "failed", error: errorMessage };
      status.mcp = { connected: false, error: "Token exchange failed" };
    }

    return Response.json(status);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    debugAPI("[mcp/status] Unexpected error:", errorMessage);
    return Response.json({
      ...status,
      tokenExchange: { status: "failed", error: errorMessage },
    });
  }
}
