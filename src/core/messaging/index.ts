import { type Message } from "@langchain/langgraph-sdk";
import { useStream } from "@langchain/langgraph-sdk/react";

import type { QueueTodo } from "@/components/ai-elements/queue";

export type StateType = { messages: Message[]; todos?: QueueTodo[] };

export const useTypedStream = useStream<
  StateType,
  {
    UpdateType: {
      messages?: Message[] | Message | string;
    };
  }
>;
