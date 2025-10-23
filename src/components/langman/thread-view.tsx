import type { AIMessage, Message, ToolMessage } from "@langchain/langgraph-sdk";
import { useMemo, useState } from "react";

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
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import { rehypeSplitWordsIntoSpans } from "@/core/rehype";
import { cn } from "@/lib/utils";

type ArrayElement<T> = T extends (infer U)[] ? U : never;
type ToolCall = ArrayElement<AIMessage["tool_calls"]>;

export function ThreadView({
  className,
  messages,
  isLoading,
  onSubmit,
  onAbort,
}: {
  className?: string;
  messages: Message[];
  isLoading?: boolean;
  onSubmit?: (message: PromptInputMessage) => void;
  onAbort?: () => void;
}) {
  const [inputText, setInputText] = useState<string>("");
  const handleSubmit = (message: PromptInputMessage) => {
    if (
      (!message.text || message.text.trim() === "") &&
      (!message.files || message.files?.length === 0)
    )
      return;
    if (isLoading) return;
    setInputText("");
    onSubmit?.(message);
  };
  const handleAbort = () => {
    if (!isLoading) return;
    onAbort?.();
  };
  const toolMessages = useMemo(() => {
    const map = new Map<string, Message>();
    for (const message of messages) {
      if (message.type === "tool") {
        map.set(message.tool_call_id, message);
      }
    }
    return map;
  }, [messages]);
  const visibleMessages = useMemo(() => {
    return messages.filter(
      (message) => message.type === "human" || message.type === "ai",
    );
  }, [messages]);
  return (
    <div id="thread-view" className={cn("relative flex flex-col", className)}>
      <Conversation className="h-full">
        <ConversationContent className="px-6 pb-[12rem]">
          {visibleMessages.map((message) => [
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
              </MessageContent>
            </MessageView>,

            ...(message.type === "ai" && message.tool_calls
              ? message.tool_calls.map((toolCall) => (
                  <ToolCallView
                    key={toolCall.id}
                    toolCall={toolCall}
                    toolMessage={
                      toolMessages.get(toolCall.id!) as ToolMessage | undefined
                    }
                  />
                ))
              : []),
          ])}
        </ConversationContent>
      </Conversation>
      <div className="absolute bottom-0 z-20 flex w-full flex-col p-4">
        <PromptInput
          className="bg-card/80 focus-within:bg-card/95 rounded-3xl backdrop-blur-sm transition-colors duration-500 [&>[data-slot='input-group']]:rounded-3xl [&>[data-slot='input-group']]:p-2"
          multiple
          globalDrop
          onSubmit={handleSubmit}
        >
          <PromptInputBody>
            <PromptInputTextarea
              className="min-h-8 transition-all duration-300"
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </PromptInputBody>
          <PromptInputFooter className="flex">
            <div className="min-w-0 flex-1"></div>
            <div>
              <PromptInputSubmit
                className="!h-8"
                status={isLoading ? "streaming" : "ready"}
                onClick={handleAbort}
              />
            </div>
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}

export function ToolCallView({
  toolCall,
  toolMessage,
}: {
  toolCall: ToolCall;
  toolMessage: ToolMessage | undefined;
}) {
  const state = useMemo(() => {
    if (!toolCall.args) {
      return "input-streaming";
    }
    if (toolMessage?.content !== undefined) {
      if (
        typeof toolMessage.content === "string" &&
        toolMessage.content.startsWith("Error:")
      ) {
        return "output-error";
      }
      return "output-available";
    }
    return "input-available";
  }, [toolCall.args, toolMessage]);
  return (
    <MessageView from="assistant">
      <MessageContent variant="flat">
        <Tool>
          <ToolHeader type={`tool-${toolCall.name}`} state={state} />
          <ToolContent>
            <ToolInput input={toolCall.args} />
            {toolMessage && (
              <ToolOutput
                output={toolMessage?.content}
                errorText={
                  typeof toolMessage?.content === "string" &&
                  toolMessage.content.startsWith("Error:")
                    ? toolMessage.content
                    : undefined
                }
              />
            )}
          </ToolContent>
        </Tool>
      </MessageContent>
    </MessageView>
  );
}
