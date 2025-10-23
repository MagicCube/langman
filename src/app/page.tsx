"use client";

import { type MessageContentImageUrl } from "@langchain/core/messages";

import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { ThreadView } from "@/components/langman/thread-view";
import { useTypedStream } from "@/core/messaging";

export default function HomePage() {
  const streamedValue = useTypedStream({
    apiUrl: "http://localhost:2024",
    assistantId: "coding_agent",
    threadId:
      typeof window !== "undefined"
        ? (new URLSearchParams(window.location.search).get("threadId") ??
          undefined)
        : undefined,
  });
  const handleSubmit = async (message: PromptInputMessage) => {
    await streamedValue.submit(
      {
        messages: [
          {
            type: "human",
            content: [
              ...(message.files ?? [])
                .filter((file) => file.mediaType?.startsWith("image/"))
                .map(
                  (file) =>
                    ({
                      type: "image_url",
                      image_url: file.url,
                    }) as MessageContentImageUrl,
                ),
              { type: "text", text: message.text ?? "" },
            ],
          },
        ],
      },
      {
        config: {
          recursion_limit: 100,
        },
      },
    );
  };
  const handleAbort = async () => {
    await streamedValue.stop();
  };
  console.info(streamedValue.values);
  return (
    <main className="flex h-screen flex-col items-center">
      <ThreadView
        className="size-full max-w-[48rem]"
        messages={streamedValue.messages}
        todos={streamedValue.values.todos}
        isLoading={streamedValue.isLoading}
        onSubmit={handleSubmit}
        onAbort={handleAbort}
      />
    </main>
  );
}
