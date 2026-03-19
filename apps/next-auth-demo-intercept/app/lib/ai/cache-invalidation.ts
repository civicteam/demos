import type { StepResult, ToolSet } from "ai";
import { closeMcpClient } from "./mcp";

const SERVER_MODIFYING_TOOLS = ["civic-manager-manage-server"];

export function handleCacheInvalidationForStep<TOOLS extends ToolSet>(
  stepResult: StepResult<TOOLS>,
  user: { id: string } | null,
): void {
  if (!stepResult.toolResults || !stepResult.toolCalls?.length) return;

  const hasServerModification = stepResult.toolCalls.some(
    (toolCall) => toolCall && SERVER_MODIFYING_TOOLS.includes(toolCall.toolName),
  );

  if (hasServerModification && user?.id) {
    closeMcpClient(user.id).catch((error) => {
      console.error(`Error during cache invalidation: ${error}`);
    });
  }
}
