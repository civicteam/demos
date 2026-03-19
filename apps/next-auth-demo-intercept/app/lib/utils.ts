import type { ModelMessage } from "ai";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function for merging Tailwind CSS classes with proper precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const isToolMessage = (message: ModelMessage): boolean => message.role === "tool";
export const isUserMessage = (message: ModelMessage): boolean => message.role === "user";

/**
 * It seems that a user message can still contain a tool result (contrary to the API). This checks if that is the case.
 * @param message
 */
export const messageHasToolResult = (message: ModelMessage) => {
  if (isToolMessage(message) || isUserMessage(message)) {
    if (Array.isArray(message.content)) {
      return message.content.some((message) => message.type === "tool-result");
    }
  }

  return false;
};

