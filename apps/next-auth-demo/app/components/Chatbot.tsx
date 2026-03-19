"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useRef } from "react";

import { MessageContent } from "./MessageContent";
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
      api: "/api/chat",
      body: { provider: "anthropic" },
    }),
    onError: (error) => {
      console.error("Error processing chat request", error);
      setIsRateLimited(true);
      setRateLimitCounter(60);
    },
  });

  const aiIsTyping = status === "streaming" || status === "submitted";

  return (
    <Card className="w-full flex flex-col h-[calc(100vh-160px)]">
      <CardHeader className="flex-shrink-0">
        <CardTitle>AI Assistant</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-center text-gray-500">
            <p>Ask me anything to get started.</p>
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
            sendMessage({ text: input });
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
  );
}
