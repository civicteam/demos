import type { StepResult, ToolSet } from "ai";
import { closeMcpClient } from "./mcp";
import { debugAPI } from "@/lib/debug";

// List of tool names that modify the server list and require cache invalidation
const SERVER_MODIFYING_TOOLS = ["civic-manager-manage-server"];

/**
 * Handles MCP client cache invalidation when server-modifying tools are called
 * This ensures that the MCP client refreshes its tool list after servers are added/removed
 *
 * @param stepResult - The step result from the AI SDK's onStepFinish callback
 * @param user - The current authenticated user (null if not authenticated)
 */
export function handleCacheInvalidationForStep<TOOLS extends ToolSet>(
  stepResult: StepResult<TOOLS>,
  user: { id: string } | null,
): void {
  // Only process tool-result steps that have tool calls
  if (!stepResult.toolResults || !stepResult.toolCalls?.length) {
    return;
  }

  // Check if any tool call is a server modification
  const hasServerModification = stepResult.toolCalls.some(
    (toolCall) => toolCall && SERVER_MODIFYING_TOOLS.includes(toolCall.toolName),
  );

  if (hasServerModification && user?.id) {
    debugAPI(`Server-modifying tool called, invalidating MCP client cache for user ${user.id}`);

    // Fire and forget - we don't need to wait for the cache invalidation
    closeMcpClient(user.id).catch((error) => {
      debugAPI(`Error during cache invalidation: ${error}`);
    });
  }
}
