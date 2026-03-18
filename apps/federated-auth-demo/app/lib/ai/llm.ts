import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";

import { observedFetch } from "@/lib/observedFetch";
import type { LanguageModelV3 } from "@ai-sdk/provider";

const openaiProvider = createOpenAI({
  fetch: observedFetch,
});
const bedrockProvider = createAmazonBedrock({
  fetch: observedFetch,
});
const anthropicProvider = createAnthropic({
  fetch: observedFetch,
});

export const models: Record<string, LanguageModelV3> = {
  // deepseek-llm-r1-distill-llama-70b does not support the Converse API so cannot be used here
  // Specify the "us." prefix in us-east-1 to route to the correct region. https://github.com/danny-avila/LibreChat/discussions/4571
  bedrock: bedrockProvider("us.anthropic.claude-3-5-sonnet-20241022-v2:0"), //('deepseek-llm-r1-distill-llama-70b'),
  openai: openaiProvider("gpt-4o"),
  anthropic: anthropicProvider("claude-sonnet-4-6-20250514"),
};
