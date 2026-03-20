import type { ToolSet } from "ai";
import { CivicMcpClient } from "@civic/mcp-client";
import { vercelAIAdapter } from "@civic/mcp-client/adapters/vercel-ai";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";

interface CachedClient {
  client: CivicMcpClient;
  lastUsed: number;
}

const clientCache = new Map<string, CachedClient>();
const INACTIVITY_TIMEOUT = 60 * 60 * 1000;

/**
 * Get the Better Auth session using the server-side API.
 */
export async function getBetterAuthSession(): Promise<{ user: { id: string; email: string; name: string } } | null> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    return session?.user ? { user: session.user } : null;
  } catch {
    return null;
  }
}

/**
 * Get a JWT token from Better Auth's token endpoint using the server-side API.
 */
async function getBetterAuthToken(): Promise<string | null> {
  try {
    const headersList = await headers();
    const tokenResponse = await auth.api.getToken({ headers: headersList });
    return tokenResponse?.token || null;
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
    if (cachedEntry) {
      cachedEntry.lastUsed = Date.now();
      return cachedEntry.client;
    }

    const clientId = process.env.CIVIC_CLIENT_ID;
    const clientSecret = process.env.CIVIC_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      console.error("CIVIC_CLIENT_ID and CIVIC_CLIENT_SECRET are required");
      return null;
    }

    const client = new CivicMcpClient({
      auth: {
        tokenExchange: {
          clientId,
          clientSecret,
          subjectToken: getBetterAuthToken as () => Promise<string>,
        },
      },
      civicProfile: process.env.CIVIC_PROFILE_ID,
    });

    clientCache.set(userId, { client, lastUsed: Date.now() });
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
