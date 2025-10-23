import type {
  MessageContentComplex,
  MessageContentImageUrl,
} from "@langchain/core/messages";
import type { AIMessage, Message, ToolMessage } from "@langchain/langgraph-sdk";
import { useMemo, useState } from "react";

import {
  Conversation,
  ConversationContent,
} from "@/components/ai-elements/conversation";
import { Image } from "@/components/ai-elements/image";
import {
  Message as MessageView,
  MessageContent,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import {
  Queue,
  QueueSectionLabel,
  QueueSectionTrigger,
  QueueList,
  QueueSectionContent,
  QueueSection,
  type QueueTodo,
  QueueItem,
  QueueItemIndicator,
  QueueItemContent,
} from "@/components/ai-elements/queue";
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
  todos,
  isLoading,
  onSubmit,
  onAbort,
}: {
  className?: string;
  messages: Message[];
  todos?: QueueTodo[];
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

  const hasTodos = todos && todos.length > 0;

  return (
    <div
      id="thread-view"
      className={cn("relative flex flex-col", hasTodos && "pt-12", className)}
    >
      {hasTodos && (
        <Queue className="bg-card absolute top-2 right-0 left-0 z-20">
          <QueueSection defaultOpen={false}>
            <QueueSectionTrigger>
              <QueueSectionLabel
                count={todos.length}
                label={`Todo Item${todos.length > 1 ? "s" : ""}`}
              />
            </QueueSectionTrigger>
            <QueueSectionContent>
              <QueueList>
                {todos.map((todo) => (
                  <QueueItem key={todo.id}>
                    <div className="flex items-center gap-2">
                      <QueueItemIndicator
                        completed={todo.status === "completed"}
                      />
                      <QueueItemContent completed={todo.status === "completed"}>
                        {todo.title}
                      </QueueItemContent>
                    </div>
                  </QueueItem>
                ))}
              </QueueList>
            </QueueSectionContent>
          </QueueSection>
        </Queue>
      )}
      <Conversation className="min-h-0 flex-1">
        <ConversationContent className="px-6 pb-[12rem]">
          {visibleMessages.map((message) => [
            hasContent(message) && (
              <MessageView
                className="flex flex-col gap-2"
                key={message.id}
                from={message.type === "human" ? "user" : "assistant"}
              >
                <MessageContent variant="flat">
                  {hasImages(message) &&
                    (message.content as MessageContentImageUrl[]).map(
                      (part, index) =>
                        part.type === "image_url" ? (
                          <img
                            key={index}
                            className="h-full max-h-42 w-fit w-full max-w-42 max-w-full overflow-hidden rounded-lg object-cover object-center opacity-100 transition-opacity duration-300"
                            alt=""
                            src={
                              typeof part.image_url === "string"
                                ? part.image_url
                                : part.image_url.url
                            }
                          />
                        ) : null,
                    )}
                </MessageContent>
                <MessageContent
                  variant={message.type === "human" ? "contained" : "flat"}
                >
                  <Response rehypePlugins={[rehypeSplitWordsIntoSpans]}>
                    {typeof message.content === "string"
                      ? message.content
                      : message.content
                          .map((part) =>
                            part.type === "text" ? part.text : "",
                          )
                          .join("\n")}
                  </Response>
                </MessageContent>
              </MessageView>
            ),

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
            <PromptInputAttachments>
              {(attachment) => <PromptInputAttachment data={attachment} />}
            </PromptInputAttachments>
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

function hasContent(message: Message): boolean {
  return (
    (typeof message.content === "string" && message.content.length > 0) ||
    (Array.isArray(message.content) && message.content.length > 0)
  );
}

function hasImages(message: Message): boolean {
  return (
    Array.isArray(message.content) &&
    message.content.some((part) => part.type === "image_url")
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
