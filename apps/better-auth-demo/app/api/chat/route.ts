import type { ModelMessage, UIMessage } from "ai";
import { stepCountIs, streamText } from "ai";

import { models } from "@/lib/ai/llm";
import { getTools } from "@/lib/ai/mcp";

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

  const tools = await getTools();

  try {
    const result = streamText({
      model,
      messages,
      system:
        "You are a helpful AI assistant that can answer questions on a variety of topics. " +
        "When answering a question, make sure to respond to the user after at most 5 tool calls, " +
        "let them know what you know so far, and what you plan to do next, and wait for further instructions.",
      tools,
      stopWhen: stepCountIs(10),
      onError: ({ error }) => {
        console.error("streamText error:", error);
      },
    });
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Error processing chat request:", error);
    return new Response("Error processing chat request", { status: 500 });
  }
}
