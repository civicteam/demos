"use client";

import type { FC } from "react";

interface SuggestionButtonProps {
  text: string;
  handleSubmit: ({ text }: { text: string }) => void;
}

const SuggestionButton: FC<SuggestionButtonProps> = ({ text, handleSubmit }) => {
  return (
    <span
      className="cursor-pointer hover:text-blue-500 underline"
      onClick={() =>
        handleSubmit({
          text,
        })
      }
    >
      {text}
    </span>
  );
};

export default SuggestionButton;
