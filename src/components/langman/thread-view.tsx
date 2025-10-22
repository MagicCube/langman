import type { Message } from "@langchain/langgraph-sdk";
import { useState } from "react";

import {
  Conversation,
  ConversationContent,
} from "@/components/ai-elements/conversation";
import {
  Message as MessageView,
  MessageContent,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { Response } from "@/components/ai-elements/response";
import { rehypeSplitWordsIntoSpans } from "@/core/rehype";
import { cn } from "@/lib/utils";

export function ThreadView({
  className,
  messages,
  isLoading,
  onSubmit,
}: {
  className?: string;
  messages: Message[];
  isLoading?: boolean;
  onSubmit?: (message: PromptInputMessage) => void;
}) {
  const [inputText, setInputText] = useState<string>("");
  const handleSubmit = (message: PromptInputMessage) => {
    if (isLoading) return;
    setInputText("");
    onSubmit?.(message);
  };
  return (
    <div id="thread-view" className={cn("relative flex flex-col", className)}>
      <Conversation className="h-full">
        <ConversationContent className="pb-[12rem]">
          {messages.map((message) => (
            <MessageView
              key={message.id}
              from={message.type === "human" ? "user" : "assistant"}
            >
              <MessageContent
                variant={message.type === "human" ? "contained" : "flat"}
              >
                <Response rehypePlugins={[rehypeSplitWordsIntoSpans]}>
                  {typeof message.content === "string"
                    ? message.content
                    : message.content
                        .map((part) =>
                          part.type === "text"
                            ? part.text
                            : typeof part.image_url === "string"
                              ? part.image_url
                              : part.image_url.url,
                        )
                        .join("\n")}
                </Response>
                {message.type === "ai" &&
                  message.tool_calls?.map((tool_call) => (
                    <p key={tool_call.id}>Calling tool: {tool_call.name}</p>
                  ))}
              </MessageContent>
            </MessageView>
          ))}
        </ConversationContent>
      </Conversation>
      <div className="absolute bottom-0 z-20 flex w-full flex-col p-4">
        <PromptInput
          className="bg-card/75 focus-within:bg-card/95backdrop-blur-sm transition-colors duration-500 [&>[data-slot='input-group']]:rounded-3xl [&>[data-slot='input-group']]:p-2"
          globalDrop
          onSubmit={handleSubmit}
        >
          <PromptInputBody>
            <PromptInputTextarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </PromptInputBody>
          <PromptInputFooter className="flex">
            <div className="min-w-0 flex-1"></div>
            <div>
              <PromptInputSubmit
                disabled={isLoading}
                className="!h-8"
                status={isLoading ? "streaming" : "ready"}
              />
            </div>
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
