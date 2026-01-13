import { debugAPI } from "@/lib/debug";
import { auth } from "@/auth";
import { experimental_createMCPClient as createMCPClient } from "@ai-sdk/mcp";
import { cookies } from "next/headers";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { PingAwareTransportWrapper } from "@/lib/ai/ping-aware-transport-wrapper";
import { exchangeTokenForCivic } from "@/lib/token-exchange";

export type MCPClient = Awaited<ReturnType<typeof createMCPClient>>;

interface CachedClient {
  client: MCPClient;
  lastUsed: number;
  civicTokenExpiry: Date;
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
 * Performs token exchange to get a Civic access token.
 */
export async function getMcpClient(): Promise<MCPClient | null> {
  try {
    // Get the current authenticated user
    const session = await auth();

    // If no user is logged in, don't create a client
    if (!session?.user?.id) {
      debugAPI("No authenticated user found, not creating MCP client");
      return null;
    }

    const userId = session.user.id;

    // Check if we already have a cached client for this user with valid Civic token
    const cachedEntry = clientCache.get(userId);
    if (cachedEntry && cachedEntry.civicTokenExpiry > new Date()) {
      debugAPI(`Using cached MCP client for user ${userId}`);
      // Update the last used timestamp
      cachedEntry.lastUsed = Date.now();
      return cachedEntry.client;
    }

    // Close expired client if exists
    if (cachedEntry) {
      debugAPI(`Civic token expired for user ${userId}, refreshing...`);
      await closeMcpClient(userId);
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

    // Create a new client for this user with the Civic token
    debugAPI(`Creating new MCP client for user ${userId}`);

    const baseTransport = new StreamableHTTPClientTransport(new URL(process.env.MCP_SERVER_URL!), {
      requestInit: {
        headers: {
          Authorization: `Bearer ${civicToken.accessToken}`,
          "x-civic-profile": "default",
        },
      },
    });

    // This is a workaround, because the vercel/ai MCPClient does not properly reply to pings.
    const transport = new PingAwareTransportWrapper(baseTransport);

    const clientConfig = {
      name: "federated-auth-demo",
      transport,
    };

    const client = await createMCPClient(clientConfig);

    // Cache the client with Civic token expiry
    clientCache.set(userId, {
      client,
      lastUsed: Date.now(),
      civicTokenExpiry: civicToken.expiresAt,
    });

    return client;
  } catch (error) {
    debugAPI("Error getting MCP client for user:", error);
    return null;
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
