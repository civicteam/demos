import type { ToolSet } from "ai";
import { debugAPI } from "@/lib/debug";
import { CivicMcpClient } from "@civic/mcp-client";
import { vercelAIAdapter } from "@civic/mcp-client/adapters/vercel-ai";
import { getUser, getTokens } from "@civic/auth/nextjs";

interface CachedClient {
  client: CivicMcpClient;
  lastUsed: number;
}

const clientCache = new Map<string, CachedClient>();
const INACTIVITY_TIMEOUT = 60 * 60 * 1000;

export async function getCivicMcpClient(): Promise<CivicMcpClient | null> {
  try {
    const user = await getUser();
    if (!user) {
      debugAPI("No authenticated user found");
      return null;
    }

    // Use the user's id or a stable identifier
    const userId = user.id || user.email || "unknown";

    const cachedEntry = clientCache.get(userId);
    if (cachedEntry) {
      debugAPI(`Using cached Civic client for user ${userId}`);
      cachedEntry.lastUsed = Date.now();
      return cachedEntry.client;
    }

    const tokens = await getTokens();
    const accessToken = tokens?.accessToken || "";

    const mcpUrl = (() => {
      const configured = process.env.MCP_SERVER_URL;
      // The MCP Hub endpoint is under `/hub/mcp`. Older configs may still point at `/mcp`.
      if (configured === "https://app.civic.com/mcp") return "https://app.civic.com/hub/mcp";
      return configured;
    })();

    const client = new CivicMcpClient({
      url: mcpUrl,
      auth: {
        token: accessToken,
      },
    });

    clientCache.set(userId, {
      client,
      lastUsed: Date.now(),
    });

    return client;
  } catch (error) {
    debugAPI("Error getting Civic client:", error);
    return null;
  }
}

export async function getTools(): Promise<ToolSet> {
  try {
    const client = await getCivicMcpClient();
    if (!client) {
      debugAPI("No Civic client available, returning empty tools");
      return {};
    }
    const tools = await client.getTools(vercelAIAdapter());
    debugAPI("Loaded tools:", Object.keys(tools));
    return tools as ToolSet;
  } catch (error) {
    debugAPI("Error getting Civic tools:", error);
    return {};
  }
}

export async function closeCivicMcpClient(userId: string): Promise<void> {
  const cachedEntry = clientCache.get(userId);
  if (cachedEntry) {
    try { await cachedEntry.client.close(); } catch (error) { debugAPI("Error closing client:", error); }
    clientCache.delete(userId);
  }
}

export async function cleanupInactiveClients(): Promise<void> {
  const now = Date.now();
  const inactiveUserIds = Array.from(clientCache.entries())
    .filter(([, { lastUsed }]) => now - lastUsed > INACTIVITY_TIMEOUT)
    .map(([userId]) => userId);
  await Promise.all(inactiveUserIds.map(closeCivicMcpClient));
}

let cleanupInterval: NodeJS.Timeout | null = null;
if (typeof window === "undefined" && !cleanupInterval) {
  cleanupInterval = setInterval(cleanupInactiveClients, 15 * 60 * 1000);
}
