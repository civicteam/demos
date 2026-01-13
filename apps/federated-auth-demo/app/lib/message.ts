import type { ModelMessage } from "ai";

import { debugAPI } from "./debug";
import { messageHasToolResult } from "./utils";

/**
 * Preprocesses chat messages before sending to the AI provider
 * - Logs recent messages for context
 * - Marks tool result messages as ephemeral to optimize token usage
 *
 * @param messages Array of chat messages to preprocess
 */
export function preprocessMessages(messages: ModelMessage[]) {
  // Log recent messages for context
  messages.slice(-3).forEach((msg, i) => {
    debugAPI(
      "Recent message %d: role=%s, content=%s",
      i,
      msg.role,
      typeof msg.content === "string" ? msg.content : "[structured content]",
    );
  });

  // If the message is a tool call, set the anthropic cache-control setting to "ephemeral"
  // to avoid using up all tokens by sending the same message several times
  const toolResultMessages = messages.filter(messageHasToolResult);
  debugAPI("Found %d tool messages to mark as ephemeral", toolResultMessages.length);

  toolResultMessages.forEach((toolResultMessage) => {
    toolResultMessage.providerOptions = {
      ...toolResultMessage.providerOptions,
      anthropic: {
        ...toolResultMessage.providerOptions?.anthropic,
        cacheControl: { type: "ephemeral" },
      },
    };
  });
}
