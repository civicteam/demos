import type { useChat } from "@ai-sdk/react";
import type { ComponentProps } from "react";
import ReactMarkdown from "react-markdown";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import type { ReasoningUIPart, UIMessage } from "ai";

// Open all links in a new window
const markdownComponents: ComponentProps<typeof ReactMarkdown>["components"] = {
  a: ({ children, ...props }) => (
    <a {...props} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
};

export const MessageContent = ({
  message,
  status,
}: {
  message: UIMessage;
  status: ReturnType<typeof useChat>["status"];
}) => {
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
      <span
        className={`inline-block p-2 rounded-lg ${
          message.role === "user" ? "bg-blue-500 text-white" : "bg-gray-200 text-black"
        }`}
      >
        <ReactMarkdown components={markdownComponents}>{textParts}</ReactMarkdown>
      </span>

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
