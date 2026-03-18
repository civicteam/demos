import type { ModelMessage } from "ai";
import { debugAPI } from "./debug";

const isToolMessage = (message: ModelMessage): boolean => message.role === "tool";
const isUserMessage = (message: ModelMessage): boolean => message.role === "user";
const messageHasToolResult = (message: ModelMessage) => {
  if (isToolMessage(message) || isUserMessage(message)) {
    if (Array.isArray(message.content)) {
      return message.content.some((m) => m.type === "tool-result");
    }
  }
  return false;
};

export function preprocessMessages(messages: ModelMessage[]) {
  messages.slice(-3).forEach((msg, i) => {
    debugAPI("Recent message %d: role=%s, content=%s", i, msg.role, typeof msg.content === "string" ? msg.content : "[structured content]");
  });
  const toolResultMessages = messages.filter(messageHasToolResult);
  debugAPI("Found %d tool messages to mark as ephemeral", toolResultMessages.length);
  toolResultMessages.forEach((m) => {
    m.providerOptions = { ...m.providerOptions, anthropic: { ...m.providerOptions?.anthropic, cacheControl: { type: "ephemeral" } } };
  });
}
