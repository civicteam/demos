import { createAnthropic } from "@ai-sdk/anthropic";
import type { LanguageModelV3 } from "@ai-sdk/provider";

const anthropicProvider = createAnthropic();

export const models: Record<string, LanguageModelV3> = {
  anthropic: anthropicProvider("claude-sonnet-4-6-20250514"),
};
