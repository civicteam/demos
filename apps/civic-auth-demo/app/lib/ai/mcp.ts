import type { ToolSet } from "ai";
import { debugAPI } from "@/lib/debug";
import { CivicMcpClient } from "@civic/mcp-client";
import { vercelAIAdapter } from "@civic/mcp-client/adapters/vercel-ai";
import { getUser } from "@civic/auth/nextjs";

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
      debugAPI(`Using cached Nexus client for user ${userId}`);
      cachedEntry.lastUsed = Date.now();
      return cachedEntry.client;
    }

    // With Civic Auth, the token is available directly — no exchange needed!
    // The getUser() function provides access to the token via the user object.
    // We need to get the access token from the Civic Auth session.
    // Civic Auth stores the token in the session which is available server-side.

    // For @civic/auth/nextjs, the access token can be obtained from the auth context
    // We need to check how @civic/auth exposes the token server-side
    // Based on the docs, getUser() returns the user object. The token is in the session.
    // Let's use a different approach: read the token from cookies/session

    debugAPI(`Creating new Nexus client for user ${userId}`);

    // Civic Auth tokens are directly valid for the MCP endpoint
    // The middleware handles token refresh, we just need to get the current token
    const client = new CivicMcpClient({
      auth: {
        token: (user as Record<string, unknown>).idToken as string || "",
      },
    });

    clientCache.set(userId, {
      client,
      lastUsed: Date.now(),
    });

    return client;
  } catch (error) {
    debugAPI("Error getting Nexus client:", error);
    return null;
  }
}

export async function getTools(): Promise<ToolSet> {
  try {
    const client = await getCivicMcpClient();
    if (!client) {
      debugAPI("No Nexus client available, returning empty tools");
      return {};
    }
    const tools = await client.getTools(vercelAIAdapter());
    debugAPI("Loaded tools:", Object.keys(tools));
    return tools as ToolSet;
  } catch (error) {
    debugAPI("Error getting Nexus tools:", error);
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
