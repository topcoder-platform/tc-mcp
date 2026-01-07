import { Annotation } from '@langchain/langgraph';
import { BaseMessage } from "@langchain/core/messages";

// Define the graph state
export const GraphState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  next: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => 'START',
  }),
});
