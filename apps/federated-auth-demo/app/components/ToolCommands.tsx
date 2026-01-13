"use client";

import { useChat } from "@ai-sdk/react";
import type { ToolUIPart, UIMessage } from "ai";
import { ChevronRight, ChevronLeft, Wrench } from "lucide-react";
import { useState } from "react";
import { formatToolName } from "../lib/formatToolName";

import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";

// Common properties for all command entries
export type BaseCommandEntry = {
  messageId: string;
  timestamp: Date;
};

// Tool specific properties
export type ToolInvocation = {
  type: "tool";
  toolName: string;
  args: Record<string, unknown>;
  result?: string;
};

// Auth URL specific properties
export type AuthUrlEntry = {
  type: "auth";
  url: string;
};

// Combined type with common properties and discriminated union
export type CommandEntry = BaseCommandEntry & (ToolInvocation | AuthUrlEntry);

type AuthorizationUrlItem = {
  type: "resource";
  resource: { uri: string; _meta?: { name: "authorization_url" } };
};
const isAuthorizationUrlItem = (item: unknown): item is AuthorizationUrlItem | null =>
  item === null ||
  (typeof item === "object" &&
    "type" in item &&
    "resource" in item &&
    typeof item.resource === "object" &&
    item.resource !== null &&
    "_meta" in item.resource &&
    typeof item.resource._meta === "object" &&
    item.resource._meta !== null &&
    "name" in item.resource._meta &&
    item.resource._meta.name === "authorization_url");

export function ToolCommands({ messages }: { messages: UIMessage[] }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { sendMessage } = useChat();

  // Function to send "Continue Job" to the LLM
  const continueMcpJob = () => {
    sendMessage({ text: "Continue Job" });
    // Use setTimeout to allow the input to be set before submitting
    setTimeout(() => {
      const event = new Event("submit", { bubbles: true, cancelable: true });
      const form = document.querySelector("form");
      if (form) form.dispatchEvent(event);
    }, 100);
  };

  // Extract both tool invocations and associated auth URLs in the correct sequence
  const combinedEntries: CommandEntry[] = [];

  messages
    // find messages with tool parts
    .filter((message) =>
      message.parts.some(
        (part) => part.type.startsWith("tool") || part.type.startsWith("dynamic_tool"),
      ),
    )
    .forEach((messageWithToolParts) => {
      // for each message, get the input and output tool invocation parts

      const toolParts = messageWithToolParts.parts.filter<ToolUIPart>(
        (part): part is ToolUIPart =>
          part.type.startsWith("tool") || part.type.startsWith("dynamic_tool"),
      );

      // get the input tool invocation part
      const inputToolPart = toolParts.find((part) => part.state === "input-available");
      const outputToolPart = toolParts.find((part) => part.state === "output-available");

      const output = outputToolPart?.output;

      combinedEntries.push({
        messageId: messageWithToolParts.id,
        toolName: inputToolPart?.type,
        args: inputToolPart?.input,
        result: outputToolPart?.output,
        timestamp: new Date(),
        type: "tool" as const,
      } as CommandEntry);

      // If it has a result, try to extract auth URL and add it immediately after
      if (output) {
        try {
          // Parse result if it's a string
          const resultObj = typeof output === "string" ? JSON.parse(output) : output;

          // Look for the specific content array with authorization_url resource
          if (resultObj?.content && Array.isArray(resultObj.content)) {
            const resourcePart: AuthorizationUrlItem | null =
              resultObj.content.find(isAuthorizationUrlItem);

            if (resourcePart?.resource?.uri) {
              // Add auth URL entry immediately after the tool invocation
              combinedEntries.push({
                messageId: messageWithToolParts.id,
                url: resourcePart.resource.uri,
                timestamp: new Date(),
                type: "auth" as const,
              } as CommandEntry);
            }
          }
        } catch (e) {
          // Silently continue if parsing fails
          console.log("Error parsing tool result:", e);
        }
      }
    });

  // If no entries, don't render the component
  if (combinedEntries.length === 0) return null;

  return (
    <Card
      className={`h-[calc(100vh-160px)] flex flex-col transition-all duration-300 ${isCollapsed ? "w-12" : "w-full"}`}
    >
      <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between p-3 pb-2">
        <div className="flex items-center">
          {!isCollapsed && (
            <>
              <Wrench className="mr-2 h-5 w-5" />
              <CardTitle className="text-sm">Tool Commands</CardTitle>
            </>
          )}
        </div>
        <Button
          className="p-1 h-8 w-8"
          size="sm"
          variant="ghost"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </Button>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="flex-grow overflow-y-auto p-3 pt-0">
          {combinedEntries.map((entry, index) => {
            // Render different UI based on entry type
            if (entry.type === "auth") {
              // Render Auth URL button
              return (
                <div
                  key={`auth-${entry.messageId}-${index}`}
                  className="mb-3 p-2 border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-900/20 rounded-md"
                >
                  <div className="text-xs text-blue-800 dark:text-blue-300 mb-2 flex justify-between items-center">
                    <div className="flex items-center">
                      <svg
                        className="mr-1"
                        fill="none"
                        height="14"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        width="14"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" x2="21" y1="14" y2="3" />
                      </svg>
                      <span>Authorization required</span>
                    </div>
                    <span className="text-xs text-blue-600 dark:text-blue-400">
                      {entry.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <Button
                    className="w-full"
                    size="sm"
                    onClick={() => {
                      const popup = window.open(entry.url, "_blank", "width=600,height=700");
                      if (popup) {
                        const timer = setInterval(() => {
                          if (popup.closed) {
                            clearInterval(timer);
                            continueMcpJob();
                          }
                        }, 500);
                      }
                    }}
                  >
                    Authorize
                  </Button>
                </div>
              );
            } else {
              // Render Tool invocation
              return (
                <Collapsible
                  key={`tool-${entry.messageId}-${index}`}
                  className="mb-3 border border-gray-200 dark:border-gray-700 rounded-md"
                >
                  <CollapsibleTrigger className="w-full p-2 text-left flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-800 rounded-t-md">
                    <div className="flex items-center">
                      <span className="font-medium text-sm">{formatToolName(entry.toolName)}</span>
                      {entry.result ? (
                        <span className="ml-2 px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                          Completed
                        </span>
                      ) : (
                        <span className="ml-2 px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                          Running
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {entry.timestamp.toLocaleTimeString()}
                    </span>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="p-2 text-sm bg-gray-50 dark:bg-gray-800/50 rounded-b-md">
                    <div className="mb-2">
                      <h4 className="font-semibold text-xs text-gray-600 mb-1">Arguments:</h4>
                      <pre className="whitespace-pre-wrap break-words text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded">
                        {JSON.stringify(entry.args, null, 2)}
                      </pre>
                    </div>

                    {entry.result && (
                      <div className="mt-3">
                        <h4 className="font-semibold text-xs text-gray-600 mb-1">Result:</h4>
                        <pre className="whitespace-pre-wrap break-words text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded">
                          {typeof entry.result === "string"
                            ? entry.result
                            : JSON.stringify(entry.result, null, 2)}
                        </pre>
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              );
            }
          })}
        </CardContent>
      )}
    </Card>
  );
}
