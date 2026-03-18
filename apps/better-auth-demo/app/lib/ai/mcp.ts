import type { ToolSet } from "ai";
import { debugAPI } from "@/lib/debug";
import { NexusClient } from "@civic/nexus-client";
import { vercelAIAdapter } from "@civic/nexus-client/adapters/vercel-ai";
import { exchangeTokenForCivic } from "@/lib/token-exchange";
import { headers } from "next/headers";

interface CachedClient {
  client: NexusClient;
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

export async function getNexusClient(): Promise<NexusClient | null> {
  try {
    const session = await getBetterAuthSession();
    if (!session?.user?.id) {
      debugAPI("No authenticated user found");
      return null;
    }

    const userId = session.user.id;

    const cachedEntry = clientCache.get(userId);
    if (cachedEntry && cachedEntry.civicTokenExpiry > new Date()) {
      debugAPI(`Using cached Nexus client for user ${userId}`);
      cachedEntry.lastUsed = Date.now();
      return cachedEntry.client;
    }

    if (cachedEntry) {
      debugAPI(`Civic token expired for user ${userId}, refreshing...`);
      await closeNexusClient(userId);
    }

    const betterAuthToken = await getBetterAuthToken();
    if (!betterAuthToken) {
      debugAPI("No Better Auth token found");
      return null;
    }

    debugAPI("Exchanging Better Auth JWT for Civic access token");
    const civicToken = await exchangeTokenForCivic(betterAuthToken);

    debugAPI(`Creating new Nexus client for user ${userId}`);
    const client = new NexusClient({
      url: process.env.MCP_SERVER_URL,
      auth: {
        token: civicToken.accessToken,
      },
      headers: {
        "x-civic-profile": "default",
      },
    });

    clientCache.set(userId, {
      client,
      lastUsed: Date.now(),
      civicTokenExpiry: civicToken.expiresAt,
    });

    return client;
  } catch (error) {
    debugAPI("Error getting Nexus client:", error);
    return null;
  }
}

export async function getTools(): Promise<ToolSet> {
  try {
    const client = await getNexusClient();
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

export async function closeNexusClient(userId: string): Promise<void> {
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
  await Promise.all(inactiveUserIds.map(closeNexusClient));
}

let cleanupInterval: NodeJS.Timeout | null = null;
if (typeof window === "undefined" && !cleanupInterval) {
  cleanupInterval = setInterval(cleanupInactiveClients, 15 * 60 * 1000);
}
