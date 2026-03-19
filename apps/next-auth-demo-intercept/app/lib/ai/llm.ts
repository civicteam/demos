import { createAnthropic } from "@ai-sdk/anthropic";
import type { LanguageModelV3 } from "@ai-sdk/provider";

import { observedFetch } from "@/lib/observedFetch";

const anthropicProvider = createAnthropic({
  fetch: observedFetch,
});

export const models: Record<string, LanguageModelV3> = {
  anthropic: anthropicProvider("claude-sonnet-4-6"),
};
