import type { ToolSet } from "ai";
import { debugAPI } from "@/lib/debug";
import { auth } from "@/auth";
import { NexusClient } from "@civic/nexus-client";
import { vercelAIAdapter } from "@civic/nexus-client/adapters/vercel-ai";
import { cookies } from "next/headers";
import { exchangeTokenForCivic } from "@/lib/token-exchange";

interface CachedClient {
  client: NexusClient;
  lastUsed: number;
  civicTokenExpiry: Date;
}

// Cache of Nexus clients by user ID
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
 * Get or create a Nexus client for the specified user ID.
 * Clients are cached and reused for subsequent requests.
 * Performs token exchange to get a Civic access token.
 */
export async function getNexusClient(): Promise<NexusClient | null> {
  try {
    // Get the current authenticated user
    const session = await auth();

    // If no user is logged in, don't create a client
    if (!session?.user?.id) {
      debugAPI("No authenticated user found, not creating Nexus client");
      return null;
    }

    const userId = session.user.id;

    // Check if we already have a cached client for this user with valid Civic token
    const cachedEntry = clientCache.get(userId);
    if (cachedEntry && cachedEntry.civicTokenExpiry > new Date()) {
      debugAPI(`Using cached Nexus client for user ${userId}`);
      // Update the last used timestamp
      cachedEntry.lastUsed = Date.now();
      return cachedEntry.client;
    }

    // Close expired client if exists
    if (cachedEntry) {
      debugAPI(`Civic token expired for user ${userId}, refreshing...`);
      await closeNexusClient(userId);
    }

    // Get the session JWT token
    const sessionToken = await getSessionToken();
    if (!sessionToken) {
      debugAPI("No session token found, cannot exchange for Civic token");
      return null;
    }

    // Exchange our JWT for a Civic access token
    debugAPI("Exchanging JWT for Civic access token");
    const civicToken = await exchangeTokenForCivic(sessionToken);

    // Create a new Nexus client for this user with the Civic token
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

    // Cache the client with Civic token expiry
    clientCache.set(userId, {
      client,
      lastUsed: Date.now(),
      civicTokenExpiry: civicToken.expiresAt,
    });

    return client;
  } catch (error) {
    debugAPI("Error getting Nexus client for user:", error);
    return null;
  }
}

/**
 * Get tools for the current user session using the Nexus client.
 * Returns tools adapted for the Vercel AI SDK.
 */
export async function getTools(): Promise<ToolSet> {
  try {
    const client = await getNexusClient();

    if (!client) {
      debugAPI("No authenticated user or Nexus client available, returning empty tools");
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

/**
 * Remove a specific user's client from the cache and close the connection
 */
export async function closeNexusClient(userId: string): Promise<void> {
  const cachedEntry = clientCache.get(userId);
  if (cachedEntry) {
    try {
      await cachedEntry.client.close();
    } catch (error) {
      debugAPI(`Error closing Nexus client for user ${userId}:`, error);
    }
    clientCache.delete(userId);
    debugAPI(`Removed Nexus client for user ${userId} from cache`);
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
  await Promise.all(inactiveUserIds.map(closeNexusClient));

  if (inactiveUserIds.length > 0) {
    debugAPI(`Cleaned up ${inactiveUserIds.length} inactive Nexus clients`);
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
    debugAPI("Registered Nexus client cleanup interval");
  }
}
