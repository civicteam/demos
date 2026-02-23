"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useRef } from "react";
import { withBasePath } from "../../lib/utils";
import { MessageContent } from "./MessageContent";
import SuggestionButton from "./SuggestionButton";
import { ToolCommands } from "./ToolCommands";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { DefaultChatTransport } from "ai";

const modelOptions = [
  // { value: 'bedrock', label: 'AWS Bedrock (Claude 3.5 Sonnet)' },
  // { value: 'openai', label: 'OpenAI (GPT 4o)' },
  { value: "anthropic", label: "Anthropic (Claude 3.7 Sonnet)" },
  // { value: 'ollama', label: 'Ollama (Deepseek R1 32b Distill) - LOCAL ONLY' },
];

export default function Chatbot() {
  const [selectedModel, setSelectedModel] = useState("anthropic");
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitCounter, setRateLimitCounter] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const [input, setInput] = useState("");

  const { messages, status, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: withBasePath("/api/chat"), // Use the utility function from utils.ts
      body: { provider: selectedModel },
    }),
    onError: (error) => {
      console.error("Error processing chat request", error);

      // Set rate limited state
      setIsRateLimited(true);
      setRateLimitCounter(60);
    },
  });

  const aiIsTyping = status === "streaming" || status === "submitted";

  // Check if any messages have tool invocations
  const hasToolInvocations = messages.some((message) =>
    message.parts?.some((part) => part.type === "tool-invocation"),
  );

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-160px)]">
      <Card className="w-full lg:flex-1 flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle>Whitelabel AI Assistant</CardTitle>
            <div className="w-64 md:w-80">
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent className="min-w-[280px]">
                  {modelOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-grow overflow-y-auto">
          {messages.length === 0 && (
            <div className="h-full flex items-center justify-center text-center text-gray-500">
              <div>
                <h3 className="text-lg font-medium mb-2">Welcome to the Whitelabel AI Assistant</h3>
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

      {/* Only render ToolCommands if there are tool invocations */}
      {hasToolInvocations && (
        <div className="hidden lg:block lg:w-1/3 max-w-sm">
          <ToolCommands messages={messages} />
        </div>
      )}
    </div>
  );
}
