import type { ToolSet } from "ai";
import { debugAPI } from "@/lib/debug";
import { auth } from "@/auth";
import { CivicMcpClient } from "@civic/mcp-client";
import { vercelAIAdapter } from "@civic/mcp-client/adapters/vercel-ai";
import { cookies } from "next/headers";

interface CachedClient {
  client: CivicMcpClient;
  lastUsed: number;
}

// Cache of MCP clients by user ID
const clientCache = new Map<string, CachedClient>();

// Timeout for client inactivity in milliseconds (60 minutes)
const INACTIVITY_TIMEOUT = 60 * 60 * 1000;

/**
 * Get the Auth.js session token from cookies.
 */
async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionToken =
    cookieStore.get("authjs.session-token")?.value ??
    cookieStore.get("__Secure-authjs.session-token")?.value;
  return sessionToken ?? null;
}

/**
 * Get or create an MCP client for the specified user ID.
 * Clients are cached and reused for subsequent requests.
 * Token exchange is handled internally by the CivicMcpClient.
 */
export async function getMcpClient(): Promise<CivicMcpClient | null> {
  try {
    // Get the current authenticated user
    const session = await auth();

    // If no user is logged in, don't create a client
    if (!session?.user?.id) {
      debugAPI("No authenticated user found, not creating MCP client");
      return null;
    }

    const userId = session.user.id;

    // Check if we already have a cached client for this user
    const cachedEntry = clientCache.get(userId);
    if (cachedEntry) {
      debugAPI(`Using cached MCP client for user ${userId}`);
      cachedEntry.lastUsed = Date.now();
      return cachedEntry.client;
    }

    const clientId = process.env.CIVIC_AUTH_CLIENT_ID;
    const clientSecret = process.env.CIVIC_AUTH_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      debugAPI("CIVIC_AUTH_CLIENT_ID and CIVIC_AUTH_CLIENT_SECRET are required");
      return null;
    }

    // Create a new MCP client with token exchange handled by the client
    debugAPI(`Creating new MCP client for user ${userId}`);

    const client = new CivicMcpClient({
      url: process.env.MCP_SERVER_URL,
      auth: {
        tokenExchange: {
          clientId,
          clientSecret,
          subjectToken: getSessionToken as () => Promise<string>,
        },
      },
      civicProfile: process.env.CIVIC_PROFILE_ID,
    });

    // Cache the client
    clientCache.set(userId, {
      client,
      lastUsed: Date.now(),
    });

    return client;
  } catch (error) {
    debugAPI("Error getting MCP client for user:", error);
    return null;
  }
}

/**
 * Get tools for the current user session using the MCP client.
 * Returns tools adapted for the Vercel AI SDK.
 */
export async function getTools(): Promise<ToolSet> {
  try {
    const client = await getMcpClient();

    if (!client) {
      debugAPI("No authenticated user or MCP client available, returning empty tools");
      return {};
    }

    const tools = await client.getTools(vercelAIAdapter());
    debugAPI("Loaded tools:", Object.keys(tools));

    return tools as ToolSet;
  } catch (error) {
    debugAPI("Error getting MCP tools:", error);
    return {};
  }
}

/**
 * Remove a specific user's client from the cache and close the connection
 */
export async function closeMcpClient(userId: string): Promise<void> {
  const cachedEntry = clientCache.get(userId);
  if (cachedEntry) {
    try {
      await cachedEntry.client.close();
    } catch (error) {
      debugAPI(`Error closing MCP client for user ${userId}:`, error);
    }
    clientCache.delete(userId);
    debugAPI(`Removed MCP client for user ${userId} from cache`);
  }
}

/**
 * Clean up inactive clients that haven't been used for the inactivity timeout period
 */
export async function cleanupInactiveClients(): Promise<void> {
  const now = Date.now();

  // Find inactive clients
  const inactiveUserIds = Array.from(clientCache.entries())
    .filter(([, { lastUsed }]) => now - lastUsed > INACTIVITY_TIMEOUT)
    .map(([userId]) => userId);

  // Close and remove inactive clients
  await Promise.all(inactiveUserIds.map(closeMcpClient));

  if (inactiveUserIds.length > 0) {
    debugAPI(`Cleaned up ${inactiveUserIds.length} inactive MCP clients`);
  }
}

// Set up periodic cleanup of inactive clients (every 15 minutes)
// Only run on the server, and only when not in a development environment
// This prevents issues with hot reloading creating multiple intervals
let cleanupInterval: NodeJS.Timeout | null = null;

if (typeof window === "undefined") {
  // Only run on server
  // Make sure we don't register multiple cleanup intervals during development
  if (!cleanupInterval) {
    const CLEANUP_INTERVAL = 15 * 60 * 1000; // 15 minutes
    cleanupInterval = setInterval(cleanupInactiveClients, CLEANUP_INTERVAL);
    debugAPI("Registered MCP client cleanup interval");
  }
}
