import type { ToolSet } from "ai";
import { CivicMcpClient } from "@civic/mcp-client";
import { vercelAIAdapter } from "@civic/mcp-client/adapters/vercel-ai";
import { exchangeTokenForCivic } from "@/lib/token-exchange";
import { headers } from "next/headers";

interface CachedClient {
  client: CivicMcpClient;
  lastUsed: number;
  civicTokenExpiry: Date;
}

const clientCache = new Map<string, CachedClient>();
const INACTIVITY_TIMEOUT = 60 * 60 * 1000;

/**
 * Get the Better Auth session by calling the /api/auth/get-session endpoint internally.
 */
async function getBetterAuthSession(): Promise<{ user: { id: string; email: string; name: string } } | null> {
  try {
    const headersList = await headers();
    const cookie = headersList.get("cookie") || "";

    const res = await fetch(`${process.env.BETTER_AUTH_URL || "http://localhost:3023"}/api/auth/get-session`, {
      headers: { cookie },
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data?.user ? { user: data.user } : null;
  } catch {
    return null;
  }
}

/**
 * Get a JWT token from Better Auth's token endpoint.
 */
async function getBetterAuthToken(): Promise<string | null> {
  try {
    const headersList = await headers();
    const cookie = headersList.get("cookie") || "";

    const res = await fetch(`${process.env.BETTER_AUTH_URL || "http://localhost:3023"}/api/auth/token`, {
      headers: { cookie },
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data?.token || null;
  } catch {
    return null;
  }
}

export async function getCivicMcpClient(): Promise<CivicMcpClient | null> {
  try {
    const session = await getBetterAuthSession();
    if (!session?.user?.id) return null;

    const userId = session.user.id;

    const cachedEntry = clientCache.get(userId);
    if (cachedEntry && cachedEntry.civicTokenExpiry > new Date()) {
      cachedEntry.lastUsed = Date.now();
      return cachedEntry.client;
    }

    if (cachedEntry) {
      await closeCivicMcpClient(userId);
    }

    const betterAuthToken = await getBetterAuthToken();
    if (!betterAuthToken) return null;

    const civicToken = await exchangeTokenForCivic(betterAuthToken);

    const client = new CivicMcpClient({
      url: process.env.MCP_SERVER_URL,
      auth: {
        token: civicToken.accessToken,
      },
    });

    clientCache.set(userId, {
      client,
      lastUsed: Date.now(),
      civicTokenExpiry: civicToken.expiresAt,
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
