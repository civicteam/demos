"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";

const messages = [
  "What can you help me with?",
  "Tell me about the latest technology trends",
  "Can you explain machine learning?",
  "What are the benefits of AI assistants?",
  "How do I get started with data analysis?",
  "Tell me about cloud computing",
  "What's the difference between AI and ML?",
  "How do I write efficient code?",
  "What are best practices for web development?",
  "Can you explain blockchain technology?",
  "What programming language should I learn first?",
  "How do I improve website performance?",
  "What are microservices?",
  "How do I secure my application?",
  "What is responsive design?",
  "Tell me about DevOps",
  "How do I debug my code efficiently?",
  "What are design patterns?",
  "How to implement authentication in my app?",
];

interface SpeechBubble {
  id: number;
  text: string;
  position: number; // 0, 1, 2 for left, center, right
}

export default function SpeechBubbles() {
  const [bubbles, setBubbles] = useState<SpeechBubble[]>([]);
  const idCounter = useRef(0);
  const usedMessages = useRef<Set<string>>(new Set());
  const MAX_BUBBLES = 3; // Reduce to only 3 visible bubbles
  const MIN_INTERVAL = 2200; // Slightly longer minimum interval
  const MAX_INTERVAL = 4000; // Slightly longer maximum interval

  // Function to get a random message that hasn't been used recently
  const getRandomMessage = () => {
    // Reset used messages if all messages have been used
    if (usedMessages.current.size >= messages.length - 5) {
      usedMessages.current = new Set();
    }

    // Get a message that hasn't been used recently
    let message: string;
    do {
      // Safe: Used for selecting random UI messages for animation, not for security/cryptographic purposes
      message = messages[Math.floor(Math.random() * messages.length)] as string; // nosemgrep: etc.security.config..semgrep.insecure-randomness
    } while (usedMessages.current.has(message));

    // Add to used messages
    usedMessages.current.add(message);
    return message;
  };

  // We no longer need random positions since all bubbles are centered
  // Keeping this as a placeholder in case we need to restore position variety later
  const getPlaceholderPosition = () => {
    return 0;
  };

  // Function to get a random interval between MIN_INTERVAL and MAX_INTERVAL
  const getRandomInterval = () => {
    // Safe: Used for UI animation timing, not for security/cryptographic purposes
    return Math.floor(Math.random() * (MAX_INTERVAL - MIN_INTERVAL + 1)) + MIN_INTERVAL; // nosemgrep: etc.security.config..semgrep.insecure-randomness
  };

  // Add new bubbles continuously, regardless of MAX_BUBBLES limit

  // We want this effect to run only once on mount and not re-run when dependencies change.
  // The functions and state setter inside are stable enough and don't need to be in deps.
  useEffect(() => {
    // Add the first bubble immediately
    if (bubbles.length === 0) {
      const newBubble: SpeechBubble = {
        id: idCounter.current++,
        text: getRandomMessage(),
        position: getPlaceholderPosition(),
      };
      setBubbles([newBubble]);
    }

    // Set up the interval for additional bubbles
    const addBubble = () => {
      // Always add a new bubble - we'll handle removal separately
      const newBubble: SpeechBubble = {
        id: idCounter.current++,
        text: getRandomMessage(),
        position: getPlaceholderPosition(),
      };

      setBubbles((prev) => [...prev, newBubble]);

      // Schedule the next bubble with a random interval
      timeoutId = setTimeout(addBubble, getRandomInterval());
    };

    let timeoutId = setTimeout(addBubble, getRandomInterval());

    return () => clearTimeout(timeoutId);
  }, [bubbles.length]);

  // Remove oldest bubble when we reach the maximum
  useEffect(() => {
    if (bubbles.length > MAX_BUBBLES) {
      // Wait a short delay before removing the oldest bubble
      // This gives time for the exit animation to play
      const timeoutId = setTimeout(() => {
        setBubbles((prev) => prev.slice(1));
      }, 800); // Longer delay for better animation flow

      return () => clearTimeout(timeoutId);
    }
  }, [bubbles.length]);

  // All bubbles will have the same position (centered)
  const getBubblePositionClass = () => {
    return "left-1/2 -translate-x-1/2 w-11/12 max-w-[700px]"; // Make bubbles wider
  };

  // Use a consistent grey background style for all bubbles
  const getBubbleStyle = () => {
    const bgColor = "bg-gray-100";
    const textColor = "text-gray-800";
    const shadow = "shadow-sm";
    // Added more padding and text size adjustments for better readability
    return `${bgColor} ${textColor} ${shadow} rounded-xl px-6 py-4 w-full border border-gray-200/50 text-base`;
  };

  return (
    <div className="relative w-full h-[500px] overflow-hidden mt-4">
      <AnimatePresence>
        {bubbles.map((bubble) => {
          // Calculate the index from the top (newest bubbles at top)
          const indexFromTop = bubbles.length - 1 - bubbles.indexOf(bubble);

          return (
            <motion.div
              key={bubble.id}
              animate={{
                opacity: 1,
                y: 30 + indexFromTop * 80, // Increase spacing between bubbles
                x: 0, // No horizontal offset
              }}
              className={`absolute ${getBubblePositionClass()}`}
              exit={{ opacity: 0, y: 400 }} // Exit further downward with fade
              initial={{ opacity: 0, y: 0 }}
              transition={{
                type: "spring",
                stiffness: 70,
                damping: 12,
                duration: 0.8,
              }}
            >
              <div className={getBubbleStyle()}>{bubble.text}</div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
