import type { ModelMessage, UIMessage } from "ai";
import { stepCountIs } from "ai";
import { streamText } from "ai";

import { preprocessMessages } from "@/lib/message";

import { models } from "@/lib/ai/llm";
import { getTools, getNexusClient } from "@/lib/ai/mcp";
import { wrapToolsWithCivicAuth } from "@/lib/ai/civic-rest-auth";
import { handleCacheInvalidationForStep } from "@/lib/ai/cache-invalidation";
import { debugAPI } from "@/lib/debug";
import { auth } from "@/auth";

// Convert UI messages (with parts) to model messages (with content)
function convertToModelMessages(messages: UIMessage[]): ModelMessage[] {
  return messages.map((msg) => {
    // If message already has content (model format), return as-is
    if ("content" in msg && msg.content !== undefined) {
      return msg as unknown as ModelMessage;
    }

    // Convert parts to content
    if ("parts" in msg && Array.isArray(msg.parts)) {
      const textParts = msg.parts
        .filter((part): part is { type: "text"; text: string } => part.type === "text")
        .map((part) => part.text);

      return {
        role: msg.role,
        content: textParts.join("\n"),
      } as ModelMessage;
    }

    // Fallback
    return msg as unknown as ModelMessage;
  });
}


export async function POST(req: Request) {
  const { messages: rawMessages, provider } = (await req.json()) as {
    messages: UIMessage[];
    provider: keyof typeof models;
  };
  const model = models[provider];

  // Convert UI messages to model messages
  const messages = convertToModelMessages(rawMessages);

  const latestMessage = messages[messages.length - 1];
  if (!model) throw new Error(`Invalid provider: ${provider}`);
  if (!latestMessage) throw new Error("No message provided");

  debugAPI("Chat request: model=%s, latest message role=%s", model.modelId, latestMessage.role);

  preprocessMessages(messages);

  // Get the Nexus tools for this user's session
  const session = await auth();
  const user = session?.user?.id ? { id: session.user.id } : null;
  const rawTools = await getTools();
  debugAPI("Loaded Nexus tools:", Object.keys(rawTools));

  // Wrap tools with civic:rest-auth handling
  let tools = rawTools;
  if (user) {
    const nexusClient = await getNexusClient();
    if (nexusClient) {
      tools = wrapToolsWithCivicAuth(rawTools, nexusClient, user.id);
    }
  }

  try {
    const result = streamText({
      model,
      messages,
      system:
        "You are a helpful AI assistant that can answer questions on a variety of topics." +
        "When answering a question, make sure to respond to the user after at most 5 tool calls," +
        "let them know what you know so far, and what you plan to do next, and wait for further instructions.",
      tools,
      // onChunk: (chunk => {
      //   debugAPI("streamText chunk: %o", chunk);
      // }),
      onStepFinish: (stepResult) => {
        debugAPI(
          "streamText step metadata: %s",
          JSON.stringify(stepResult.providerMetadata, null, 2),
        );

        // Handle cache invalidation for server-modifying tools
        handleCacheInvalidationForStep(stepResult, user);
      },
      stopWhen: stepCountIs(10),
      onError: ({ error }) => {
        debugAPI("streamText error: %o", error);
        if ((error as { reason: string }).reason === "maxRetriesExceeded") {
          debugAPI("Max retries exceeded");
        }
      },
      providerOptions: {
        anthropic: {
          // thinking: { type: 'enabled', budgetTokens: 12000 },
        },
      },
    });
    debugAPI("Returning data stream response");
    return result.toUIMessageStreamResponse();
  } catch (error) {
    debugAPI("Error processing chat request: %o", error);
    return new Response("Error processing chat request", { status: 500 });
  }
}
