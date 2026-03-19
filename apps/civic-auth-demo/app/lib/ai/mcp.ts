import type { ToolSet } from "ai";
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
    if (!user) return null;

    const userId = user.id || user.email || "unknown";

    const cachedEntry = clientCache.get(userId);
    if (cachedEntry) {
      cachedEntry.lastUsed = Date.now();
      return cachedEntry.client;
    }

    const tokens = await getTokens();
    const accessToken = tokens?.accessToken || "";

    const client = new CivicMcpClient({
      url: process.env.MCP_SERVER_URL,
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
    console.error("Error getting Civic client:", error);
    return null;
  }
}

export async function getTools(): Promise<ToolSet> {
  try {
    const client = await getCivicMcpClient();
    if (!client) return {};
    return (await client.getTools(vercelAIAdapter())) as ToolSet;
  } catch (error) {
    console.error("Error getting Civic tools:", error);
    return {};
  }
}

export async function closeCivicMcpClient(userId: string): Promise<void> {
  const cachedEntry = clientCache.get(userId);
  if (cachedEntry) {
    try { await cachedEntry.client.close(); } catch (error) { console.error("Error closing client:", error); }
    clientCache.delete(userId);
  }
}

async function cleanupInactiveClients(): Promise<void> {
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
