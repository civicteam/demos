import { createAnthropic } from "@ai-sdk/anthropic";
import type { LanguageModelV3 } from "@ai-sdk/provider";

const anthropicProvider = createAnthropic();

export const models: Record<string, LanguageModelV3> = {
  anthropic: anthropicProvider("claude-3-7-sonnet-20250219"),
};
