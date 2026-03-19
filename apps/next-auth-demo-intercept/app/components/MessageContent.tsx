import type { useChat } from "@ai-sdk/react";
import ReactMarkdown from "react-markdown";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import type { ReasoningUIPart, UIMessage } from "ai";

export const MessageContent = ({
  message,
  status,
}: {
  message: UIMessage;
  status: ReturnType<typeof useChat>["status"];
}) => {
  // Split parts into reasoning and text
  const reasoningParts = message.parts
    ?.filter<ReasoningUIPart>((part) => part.type === "reasoning")
    .map((part) => part.text)
    .join("\n");

  const textParts = message.parts
    ?.filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n");

  return (
    <div
      key={message.id}
      className={`mb-4 ${message.role === "user" ? "text-right" : "text-left"}`}
    >
      {/* Markdown text content */}
      <span
        className={`inline-block p-2 rounded-lg ${
          message.role === "user" ? "bg-blue-500 text-white" : "bg-gray-200 text-black"
        }`}
      >
        <ReactMarkdown>{textParts}</ReactMarkdown>
      </span>

      {/* Reasoning content */}
      {reasoningParts && (
        <Collapsible className="mt-2" defaultOpen={status !== "ready"}>
          <CollapsibleTrigger className="cursor-pointer text-sm italic text-gray-500">
            Reasoning
          </CollapsibleTrigger>
          <CollapsibleContent className="p-2 border border-gray-300 rounded text-sm italic text-gray-500">
            {reasoningParts}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};
