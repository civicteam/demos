"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useRef } from "react";
import { useCivicAuth } from "../hooks/useCivicAuth";

import { withBasePath } from "../../lib/utils";
import { MessageContent } from "./MessageContent";
import SuggestionButton from "./SuggestionButton";
import { ToolCommands } from "./ToolCommands";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { DefaultChatTransport } from "ai";

export default function Chatbot() {
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitCounter, setRateLimitCounter] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const [input, setInput] = useState("");

  const { messages, status, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: withBasePath("/api/chat"),
      body: { provider: "anthropic" },
    }),
    onError: (error) => {
      console.error("Error processing chat request", error);
      setIsRateLimited(true);
      setRateLimitCounter(60);
    },
  });

  const aiIsTyping = status === "streaming" || status === "submitted";
  useCivicAuth(aiIsTyping);

  const hasToolInvocations = messages.some((message) =>
    message.parts?.some((part) => part.type === "tool-invocation"),
  );

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-160px)]">
      <Card className="w-full lg:flex-1 flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle>AI Assistant (Intercept)</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow overflow-y-auto">
          {messages.length === 0 && (
            <div className="h-full flex items-center justify-center text-center text-gray-500">
              <div>
                <h3 className="text-lg font-medium mb-2">Welcome to the AI Assistant</h3>
                <p>Ask me anything to get started.</p>
                <p className="text-gray-400 italic mt-2">
                  Not sure how to start? Try:{" "}
                  <SuggestionButton text="What can you do?" handleSubmit={sendMessage} />
                </p>
              </div>
            </div>
          )}
          {messages.map((message) => (
            <MessageContent key={message.id} message={message} status={status} />
          ))}
          {aiIsTyping && (
            <div className="text-left">
              <span className="inline-block p-2 rounded-lg bg-gray-200 text-black">
                AI is typing...
              </span>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex-shrink-0 border-t">
          <form
            ref={formRef}
            className="flex w-full space-x-2"
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage({
                text: input,
              });
            }}
          >
            <Input
              className="flex-grow"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <Button disabled={aiIsTyping || isRateLimited} type="submit">
              {isRateLimited ? `Retry in ${rateLimitCounter}s` : "Send"}
            </Button>
          </form>
        </CardFooter>
      </Card>

      {hasToolInvocations && (
        <div className="hidden lg:block lg:w-1/3 max-w-sm">
          <ToolCommands messages={messages} />
        </div>
      )}
    </div>
  );
}
