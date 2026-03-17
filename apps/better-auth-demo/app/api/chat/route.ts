import type { ModelMessage, UIMessage } from "ai";
import { stepCountIs, streamText } from "ai";
import { preprocessMessages } from "@/lib/message";
import { models } from "@/lib/ai/llm";
import { getTools, getNexusClient } from "@/lib/ai/mcp";
import { wrapToolsWithCivicAuth } from "@/lib/ai/civic-rest-auth";
import { handleCacheInvalidationForStep } from "@/lib/ai/cache-invalidation";
import { debugAPI } from "@/lib/debug";
import { headers } from "next/headers";

function convertToModelMessages(messages: UIMessage[]): ModelMessage[] {
  return messages.map((msg) => {
    if ("content" in msg && msg.content !== undefined) {
      return msg as unknown as ModelMessage;
    }
    if ("parts" in msg && Array.isArray(msg.parts)) {
      const textParts = msg.parts
        .filter((part): part is { type: "text"; text: string } => part.type === "text")
        .map((part) => part.text);
      return { role: msg.role, content: textParts.join("\n") } as ModelMessage;
    }
    return msg as unknown as ModelMessage;
  });
}

async function getSessionUser(): Promise<{ id: string } | null> {
  try {
    const headersList = await headers();
    const cookie = headersList.get("cookie") || "";
    const res = await fetch(`${process.env.BETTER_AUTH_URL || "http://localhost:3023"}/api/auth/get-session`, {
      headers: { cookie },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.user ? { id: data.user.id } : null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const { messages: rawMessages, provider } = (await req.json()) as {
    messages: UIMessage[];
    provider: keyof typeof models;
  };
  const model = models[provider];

  const messages = convertToModelMessages(rawMessages);
  const latestMessage = messages[messages.length - 1];
  if (!model) throw new Error(`Invalid provider: ${provider}`);
  if (!latestMessage) throw new Error("No message provided");

  debugAPI("Chat request: model=%s", model.modelId);
  preprocessMessages(messages);

  const user = await getSessionUser();
  const rawTools = await getTools();
  debugAPI("Loaded Nexus tools:", Object.keys(rawTools));

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
      onStepFinish: (stepResult) => {
        handleCacheInvalidationForStep(stepResult, user);
      },
      stopWhen: stepCountIs(10),
      onError: ({ error }) => {
        debugAPI("streamText error: %o", error);
      },
    });
    return result.toUIMessageStreamResponse();
  } catch (error) {
    debugAPI("Error processing chat request: %o", error);
    return new Response("Error processing chat request", { status: 500 });
  }
}
