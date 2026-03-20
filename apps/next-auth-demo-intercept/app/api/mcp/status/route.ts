import { auth } from "@/auth";
import { getMcpClient } from "@/lib/ai/mcp";

export interface McpStatusResponse {
  authenticated: boolean;
  tokenExchange: {
    status: "success" | "failed" | "pending";
    error?: string;
    accessToken?: string;
  };
  mcp: {
    connected: boolean;
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
    const session = await auth();
    status.authenticated = !!session?.user;
    if (!status.authenticated) return Response.json(status);

    try {
      const client = await getMcpClient();
      if (!client) {
        status.tokenExchange = { status: "failed", error: "Could not create MCP client" };
        return Response.json(status);
      }

      const token = await client.getConfig().resolveToken();
      status.tokenExchange = { status: "success", accessToken: client.getAccessToken() };

      try {
        const mcpResponse = await fetch("https://app.civic.com/hub/mcp", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        status.mcp = { connected: mcpResponse.ok || mcpResponse.status !== 401 };
        if (mcpResponse.status === 401) {
          const text = await mcpResponse.text();
          status.mcp = { connected: false, error: `Auth failed: ${text.slice(0, 100)}` };
        }
      } catch (mcpError) {
        const msg = mcpError instanceof Error ? mcpError.message : "Unknown error";
        status.mcp = { connected: false, error: msg.includes("ECONNREFUSED") ? "MCP Hub not running" : msg };
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      status.tokenExchange = { status: "failed", error: msg };
      status.mcp = { connected: false, error: "Token exchange failed" };
    }

    return Response.json(status);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ ...status, tokenExchange: { status: "failed", error: msg } });
  }
}
