import type { ToolSet } from "ai";
import { debugAPI } from "@/lib/debug";
import { auth } from "@/auth";
import { CivicMcpClient } from "@civic/mcp-client";
import { vercelAIAdapter } from "@civic/mcp-client/adapters/vercel-ai";
import { exchangeTokenForCivic } from "@/lib/token-exchange";
import { decode } from "next-auth/jwt";
import { cookies } from "next/headers";

interface CachedClient {
  client: CivicMcpClient;
  lastUsed: number;
  civicTokenExpiry: Date;
}

const clientCache = new Map<string, CachedClient>();
const INACTIVITY_TIMEOUT = 60 * 60 * 1000;

/**
 * Get the Google ID token from the NextAuth JWT.
 * The ID token was stored in the jwt callback when the user signed in with Google.
 */
async function getGoogleIdToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken =
      cookieStore.get("authjs.session-token")?.value ??
      cookieStore.get("__Secure-authjs.session-token")?.value;

    if (!sessionToken) return null;

    const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
    if (!secret) return null;

    const decoded = await decode({
      token: sessionToken,
      secret,
      salt: "authjs.session-token",
    });

    return (decoded?.googleIdToken as string) || null;
  } catch (error) {
    debugAPI("Error decoding JWT for Google ID token:", error);
    return null;
  }
}

export async function getCivicMcpClient(): Promise<CivicMcpClient | null> {
  try {
    const session = await auth();
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
      await closeCivicMcpClient(userId);
    }

    const googleIdToken = await getGoogleIdToken();
    if (!googleIdToken) {
      debugAPI("No Google ID token found");
      return null;
    }

    debugAPI("Exchanging Google ID token for Civic access token");
    const civicToken = await exchangeTokenForCivic(googleIdToken);

    debugAPI(`Creating new Nexus client for user ${userId}`);
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
