import type { ToolSet } from "ai";
import { auth } from "@/auth";
import { CivicMcpClient } from "@civic/mcp-client";
import { vercelAIAdapter } from "@civic/mcp-client/adapters/vercel-ai";
import { cookies } from "next/headers";

interface CachedClient {
  client: CivicMcpClient;
  lastUsed: number;
}

const clientCache = new Map<string, CachedClient>();
const INACTIVITY_TIMEOUT = 60 * 60 * 1000;

async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionToken =
    cookieStore.get("authjs.session-token")?.value ??
    cookieStore.get("__Secure-authjs.session-token")?.value;
  return sessionToken ?? null;
}

export async function getMcpClient(): Promise<CivicMcpClient | null> {
  try {
    const session = await auth();
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
          subjectToken: getSessionToken as () => Promise<string>,
        },
      },
      civicProfile: process.env.CIVIC_PROFILE_ID,
      capabilities: {
        experimental: {
          "civic:rest-auth": { version: "1.0" },
        },
      },
    });

    clientCache.set(userId, { client, lastUsed: Date.now() });
    return client;
  } catch (error) {
    console.error("Error getting MCP client:", error);
    return null;
  }
}

export async function getTools(): Promise<ToolSet> {
  try {
    const client = await getMcpClient();
    if (!client) return {};
    return (await client.getTools(vercelAIAdapter())) as ToolSet;
  } catch (error) {
    console.error("Error getting MCP tools:", error);
    return {};
  }
}

export async function closeMcpClient(userId: string): Promise<void> {
  const cachedEntry = clientCache.get(userId);
  if (cachedEntry) {
    try {
      await cachedEntry.client.close();
    } catch (error) {
      console.error(`Error closing MCP client for user ${userId}:`, error);
    }
    clientCache.delete(userId);
  }
}

async function cleanupInactiveClients(): Promise<void> {
  const now = Date.now();
  const inactiveUserIds = Array.from(clientCache.entries())
    .filter(([, { lastUsed }]) => now - lastUsed > INACTIVITY_TIMEOUT)
    .map(([userId]) => userId);
  await Promise.all(inactiveUserIds.map(closeMcpClient));
}

export function getCivicAuthToken(userId: string): string | null {
  const cachedEntry = clientCache.get(userId);
  if (!cachedEntry) return null;
  return cachedEntry.client.getAccessToken() ?? null;
}

let cleanupInterval: NodeJS.Timeout | null = null;
if (typeof window === "undefined" && !cleanupInterval) {
  cleanupInterval = setInterval(cleanupInactiveClients, 15 * 60 * 1000);
}
