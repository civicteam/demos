import type { ToolSet } from "ai";
import type { CivicMcpClient } from "@civic/mcp-client";
import { getCivicAuthToken } from "./mcp";

interface PendingAuth {
  authUrl: string;
  pollingEndpoint: string;
  continueJobId: string;
  status: "pending" | "approved" | "timeout" | "error";
  createdAt: number;
}

const STALE_ENTRY_MS = 3 * 60 * 1000; // 3 minutes
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 15_000; // 15s — give user time to auth before falling through to LLM
const MAX_AUTH_ITERATIONS = 10;

const pendingAuthStore = new Map<string, PendingAuth>();

/**
 * Clean up stale entries from the pending auth store.
 */
function cleanupStaleEntries() {
  const now = Date.now();
  for (const [key, entry] of pendingAuthStore) {
    if (now - entry.createdAt > STALE_ENTRY_MS) {
      pendingAuthStore.delete(key);
    }
  }
}

/**
 * Get the current pending auth state for a user.
 */
export function getPendingAuth(userId: string): PendingAuth | undefined {
  cleanupStaleEntries();
  return pendingAuthStore.get(userId);
}

/**
 * Clear pending auth for a user.
 */
export function clearPendingAuth(userId: string): void {
  pendingAuthStore.delete(userId);
}

interface CivicAuthFields {
  continueJobId: string;
  pollingEndpoint: string;
}

/**
 * Detect civic:rest-auth fields in a tool result.
 * Looks for resource items with _meta.name "auth_polling_endpoint" and "continue_job_id".
 */
export function parseCivicAuthResponse(result: unknown): CivicAuthFields | null {
  if (!result || typeof result !== "object") return null;

  const obj = result as Record<string, unknown>;
  let content: unknown[] | undefined;

  if (Array.isArray(obj.content)) {
    content = obj.content;
  } else if (Array.isArray(result)) {
    content = result;
  }

  if (!content) return null;

  let pollingEndpoint: string | null = null;
  let continueJobId: string | null = null;

  for (const item of content) {
    if (!item || typeof item !== "object") continue;
    const entry = item as Record<string, unknown>;

    // Check for resource items with _meta.name (server format)
    if (entry.type === "resource" && entry.resource && typeof entry.resource === "object") {
      const resource = entry.resource as Record<string, unknown>;
      const meta = resource._meta as Record<string, unknown> | undefined;
      if (meta?.name === "auth_polling_endpoint" && typeof resource.text === "string") {
        pollingEndpoint = resource.text;
      }
      if (meta?.name === "continue_job_id" && typeof resource.text === "string") {
        continueJobId = resource.text;
      }
    }

    // Fallback: check for text content with JSON
    if (entry.type === "text" && typeof entry.text === "string") {
      try {
        const parsed = JSON.parse(entry.text) as Record<string, unknown>;
        if (
          typeof parsed.auth_polling_endpoint === "string" &&
          typeof parsed.continue_job_id === "string"
        ) {
          pollingEndpoint = parsed.auth_polling_endpoint;
          continueJobId = parsed.continue_job_id;
        }
      } catch {
        // Not JSON, skip
      }
    }
  }

  if (pollingEndpoint && continueJobId) {
    console.log("[civic-rest-auth] Found auth fields: pollingEndpoint=%s, continueJobId=%s", pollingEndpoint, continueJobId);
    return { pollingEndpoint, continueJobId };
  }

  return null;
}

/**
 * Fetch the auth URL from the polling endpoint.
 */
async function fetchAuthUrl(
  pollingEndpoint: string,
  civicToken: string,
): Promise<string | null> {
  const res = await fetch(pollingEndpoint, {
    method: "GET",
    headers: { Authorization: `Bearer ${civicToken}` },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as Record<string, unknown>;
  return typeof data.authUrl === "string" ? data.authUrl : null;
}

/**
 * Poll the auth endpoint with HEAD requests until approved or timeout.
 * Server returns 200 when approved, 202 when still pending.
 */
async function pollForApproval(
  pollingEndpoint: string,
  civicToken: string,
  timeoutMs: number = POLL_TIMEOUT_MS,
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    // Wait BEFORE checking so the client has time to poll and open the popup
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    try {
      const res = await fetch(pollingEndpoint, {
        method: "HEAD",
        headers: { Authorization: `Bearer ${civicToken}` },
      });
      console.log("[civic-rest-auth] Poll HEAD status: %d", res.status);
      // 200 = approved, 202 = still pending, 422 = error
      if (res.status === 200) return true;
      if (res.status === 422) return false;
    } catch (err) {
      console.log("[civic-rest-auth] Error polling auth endpoint:", err);
    }
  }

  return false;
}

/**
 * Handle the full auth flow for a single auth response:
 * fetch authUrl, store in pending, poll, call continue_job.
 *
 * If the user authenticates within 15s, continue_job is called and the final
 * result is returned transparently (the LLM never sees the auth).
 *
 * If 15s elapses, the LLM receives a message with the auth URL so it can
 * inform the user.
 */
async function handleAuthFlow(
  authFields: CivicAuthFields,
  civicClient: CivicMcpClient,
  userId: string,
  civicToken: string,
): Promise<unknown> {
  const { pollingEndpoint, continueJobId } = authFields;

  // 1. Fetch the auth URL from the polling endpoint
  const authUrl = await fetchAuthUrl(pollingEndpoint, civicToken);
  if (!authUrl) {
    console.log("[civic-rest-auth] Failed to fetch auth URL from polling endpoint");
    return {
      content: [{ type: "text", text: "Failed to retrieve authorization URL. Please try again." }],
      isError: true,
    };
  }

  // 2. Store in pending auth store so the client can show a clickable link
  pendingAuthStore.set(userId, {
    authUrl,
    pollingEndpoint,
    continueJobId,
    status: "pending",
    createdAt: Date.now(),
  });

  console.log("[civic-rest-auth] Stored pending auth for user %s, authUrl: %s", userId, authUrl);

  // 3. Poll for approval (15s timeout)
  const approved = await pollForApproval(pollingEndpoint, civicToken);

  if (!approved) {
    // Timeout — let the LLM know so it can inform the user
    const entry = pendingAuthStore.get(userId);
    if (entry) entry.status = "timeout";
    // Keep the entry around so the client can still show the link
    console.log("[civic-rest-auth] Auth polling timed out for user %s", userId);
    return {
      content: [{
        type: "text",
        text: `This action requires authorization. Please ask the user to authorize at: ${authUrl} — once they have completed authorization, retry the action.`,
      }],
    };
  }

  // 4. Auth approved — clean up and call continue_job
  clearPendingAuth(userId);

  console.log("[civic-rest-auth] Auth approved for user %s, calling continue_job with jobId: %s", userId, continueJobId);

  try {
    const continueResult = await civicClient.callTool("continue_job", { params: { jobId: continueJobId } });
    return continueResult;
  } catch (err) {
    console.log("[civic-rest-auth] Error calling continue_job:", err);
    return {
      content: [{
        type: "text",
        text: `Authorization succeeded but failed to continue the operation. Error: ${err instanceof Error ? err.message : String(err)}`,
      }],
      isError: true,
    };
  }
}

/**
 * Wrap a ToolSet so that each tool's execute function intercepts civic:rest-auth
 * responses and transparently handles the auth flow before returning the final result.
 */
export function wrapToolsWithCivicAuth(
  tools: ToolSet,
  civicClient: CivicMcpClient,
  userId: string,
): ToolSet {
  const wrapped: ToolSet = {};

  for (const [name, tool] of Object.entries(tools)) {
    const originalExecute = tool.execute as
      | ((input: unknown, options: unknown) => Promise<unknown>)
      | undefined;

    if (!originalExecute) {
      wrapped[name] = tool;
      continue;
    }

    const wrappedExecute = async (args: unknown, options: unknown) => {
      let result = await originalExecute(args, options);

      const civicToken = getCivicAuthToken(userId);
      if (!civicToken) return result;

      // Check for auth response and handle iteratively (max MAX_AUTH_ITERATIONS)
      for (let i = 0; i < MAX_AUTH_ITERATIONS; i++) {
        const authFields = parseCivicAuthResponse(result);
        if (!authFields) break;

        console.log("[civic-rest-auth] Intercepted auth response for tool \"%s\" (iteration %d)", name, i + 1);
        result = await handleAuthFlow(authFields, civicClient, userId, civicToken);
      }

      return result;
    };

    wrapped[name] = {
      ...tool,
      execute: wrappedExecute,
    } as ToolSet[string];
  }

  return wrapped;
}
