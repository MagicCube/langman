"use client";

import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { ThreadView } from "@/components/langman/thread-view";
import { useTypedStream } from "@/core/messaging";

export default function HomePage() {
  const streamedValue = useTypedStream({
    apiUrl: "http://localhost:2024",
    assistantId: "coding_agent",
  });
  const handleSubmit = async (message: PromptInputMessage) => {
    await streamedValue.submit({
      messages: [{ type: "human", content: message.text ?? "" }],
    });
  };
  const handleAbort = async () => {
    await streamedValue.stop();
  };
  return (
    <main className="flex h-screen flex-col items-center">
      <ThreadView
        className="size-full max-w-[48rem]"
        messages={streamedValue.messages}
        isLoading={streamedValue.isLoading}
        onSubmit={handleSubmit}
        onAbort={handleAbort}
      />
    </main>
  );
}
