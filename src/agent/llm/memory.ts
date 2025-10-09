import { BaseChatMessageHistory } from "@langchain/core/chat_history";
import { AIMessage, BaseMessage, HumanMessage, mapChatMessagesToStoredMessages, ToolMessage } from "@langchain/core/messages";
import { Model } from 'mongoose';
import { ConversationDocument } from "../models/conversation.schema";


/**
 * A Chat History class that interacts directly with MongoDB.
 */
export class MongoDBChatHistory extends BaseChatMessageHistory {
  lc_namespace = ["langchain", "stores", "message", "mongodb"];

  constructor(private sessionId: string, private userId: string, private conversationModel: Model<ConversationDocument>) {
    super();
  }

  async getMessages(): Promise<BaseMessage[]> {
    const conversation = await this.conversationModel.findOne({
      sessionId: this.sessionId,
      userId: this.userId,
    });

    return conversation ? mapDbMessagesToLangChainMessages(conversation.messages) : [];
  }

  async addMessage(message: BaseMessage): Promise<void> {
    const storedMessage = mapChatMessagesToStoredMessages([message])[0];
    const dbMessage = {
      author: storedMessage.type === "human" ? "user" : "bot",
      content: storedMessage.data.content,
      timestamp: new Date(),
    };

    await this.conversationModel.findOneAndUpdate(
      { sessionId: this.sessionId },
      {
        $push: { messages: dbMessage },
        $set: { userId: this.userId },
      },
      { upsert: true }
    );
  }

  async addUserMessage(message: string): Promise<void> {
    await this.addMessage(new HumanMessage(message));
  }

  async addAIChatMessage(message: string): Promise<void> {
    await this.addMessage(new AIMessage(message));
  }

  async clear(): Promise<void> {
    await this.conversationModel.deleteOne({ sessionId: this.sessionId });
  }
}

/**
 * A wrapper class that adds an in-memory cache layer on top of a primary Chat History store.
 */
export class CachedChatHistory extends BaseChatMessageHistory {
  lc_namespace = ["app", "stores", "message", "cached"];
  private cache: BaseMessage[] | null = null;
  private dbHistory: MongoDBChatHistory; // Specifically typed for clarity

  constructor(dbHistory: MongoDBChatHistory) {
    super();
    this.dbHistory = dbHistory;
  }

  async getMessages(): Promise<BaseMessage[]> {
    if (this.cache) {
      console.log(`Cache HIT for session. Returning ${this.cache.length} messages from memory.`);
      return this.cache;
    }

    console.log(`Cache MISS for session. Fetching from database...`);
    const messages = await this.dbHistory.getMessages();
    this.cache = messages;
    return messages;
  }

  async addMessage(message: BaseMessage): Promise<void> {
    // This is the generic method. We'll handle specific logic in helpers.
    if (!this.cache) {
      await this.getMessages();
    }
    this.cache!.push(message);
    await this.dbHistory.addMessage(message);
  }

  async addUserMessage(message: string): Promise<void> {
    if (!this.cache) {
      await this.getMessages();
    }
    this.cache!.push(new HumanMessage(message));
    await this.dbHistory.addUserMessage(message);
  }

  async addAIChatMessage(message: string): Promise<void> {
    if (!this.cache) {
      await this.getMessages();
    }

    await this.dbHistory.addAIChatMessage(message);

    // Process the raw string into clean messages
    // for the in-memory cache, which the agent will use for the next turn.
    const cleanMessages = mapDbMessagesToLangChainMessages([
      {
        author: "bot",
        content: message,
      },
    ]);

    // Add the clean, processed messages to the cache,
    // tool results will be a separate message in llm history.
    this.cache!.push(...cleanMessages);
  }

  async clear(): Promise<void> {
    this.cache = [];
  }
}

const activeSessionHistoryCache = new Map<string, CachedChatHistory>();
const MAX_CACHE_SIZE = 500;

function manageCacheSize() {
  if (activeSessionHistoryCache.size > MAX_CACHE_SIZE) {
    const oldestKey = activeSessionHistoryCache.keys().next().value;
    if (oldestKey) activeSessionHistoryCache.delete(oldestKey);
    console.log(`Session History cache limit reached. Evicted session: ${oldestKey}`);
  }
}

/**
 * Converts our database message format to LangChain's BaseMessage format.
 * @param messages Messages from our MongoDB model.
 * @returns An array of BaseMessage objects.
 */
function mapDbMessagesToLangChainMessages(messages: any[]): BaseMessage[] {
  const result: BaseMessage[] = [];

  if (messages.length > 10) {
    console.log(`Original messages length: ${messages.length}. Slicing to latest 10.`);
    messages = messages.slice(-10);
  }

  for (const [index, msg] of messages.entries()) {
    if (msg.author === "user") {
      result.push(new HumanMessage(msg.content));
    } else if (msg.author === "bot") {
      try {
        const parsedContent = JSON.parse(msg.content);

        if (parsedContent && typeof parsedContent.accumulatedOutput === "string") {
          const aiResponseMessage = new AIMessage(parsedContent.accumulatedOutput.replace(/{{.*?}}/g, "").trim());
          const toolMessages: ToolMessage[] = [];
          const toolCallsForAiMessage: any[] = [];

          if (Array.isArray(parsedContent.tool_results)) {
            for (const toolResult of parsedContent.tool_results) {
              const parsed = parseToolDataForLLM(toolResult, index);
              if (parsed) {
                toolCallsForAiMessage.push(parsed.toolCallForAiMessage);
                toolMessages.push(parsed.toolMessage);
              }
            }
          }

          result.push(aiResponseMessage);

          if (toolMessages.length > 0) {
            aiResponseMessage.tool_calls = toolCallsForAiMessage;
            result.push(...toolMessages);
          }
        } else {
          result.push(new AIMessage(msg.content));
        }
      } catch (e) {
        result.push(new AIMessage(msg.content));
      }
    }
  }
  return result;
}

/**
 * Parses a single raw tool result from the database into a format ready for the LLM.
 * This function is the core of our defensive parsing logic.
 *
 * @param toolResult The raw tool_result object from the parsed database content.
 * @param messageIndex The index of the parent message, used for creating a debuggable ID.
 * @returns An object containing the AIMessage `tool_calls` part and the `ToolMessage`, or `null` if the input is invalid.
 */
function parseToolDataForLLM(toolResult: any, messageIndex: number): { toolCallForAiMessage: any; toolMessage: ToolMessage } | null {
  try {
    // Basic validation of the input structure
    if (!toolResult || !toolResult.toolName) {
      return null;
    }

    // 1. Dive deep into the nested structure to get the real tool output string.
    const innerJsonString = toolResult.data?.[0]?.text;
    if (!innerJsonString || typeof innerJsonString !== "string") {
      return null; // Skip if the expected nested structure is missing
    }

    // 2. Parse the inner JSON to inspect its contents.
    const innerData = JSON.parse(innerJsonString);

    // 3. Validate: Only proceed if the innermost 'data' array is NOT empty.
    // This is the check that prevents the Bedrock ValidationException.
    if (!Array.isArray(innerData.data) || innerData.data.length === 0) {
      return null; // This was an empty result; ignore it for the AI's history.
    }

    // 4. If validation passes, create the structured parts.
    const toolCallId = `msg_${messageIndex}_tool_call_${Math.random().toString(36).substring(2, 9)}`;

    const toolCallForAiMessage = {
      name: toolResult.toolName,
      args: {},
      id: toolCallId,
    };

    const toolMessage = new ToolMessage({
      content: innerData.data,
      tool_call_id: toolCallId,
    });

    return { toolCallForAiMessage, toolMessage };
  } catch (e) {
    console.error(`Skipping malformed tool result in history for message ${messageIndex}:`, e);
    return null;
  }
}

/**
 * Factory function to get a cached chat history manager for a session.
 * @param sessionId The user's session ID.
 * @param userId The user's unique ID.
 * @returns An instance of a chat history manager that uses an in-memory cache.
 */
// export const getSessionMemory = (sessionId: string, userId: string): BaseChatMessageHistory => {
//   if (!activeSessionHistoryCache.has(sessionId)) {
//     const dbHistory = new MongoDBChatHistory(sessionId, userId);
//     const cachedHistory = new CachedChatHistory(dbHistory);
//     activeSessionHistoryCache.set(sessionId, cachedHistory);
//     manageCacheSize();
//   }

//   const historyInstance = activeSessionHistoryCache.get(sessionId)!;

//   // Delete & Set again to push it to newest because of we are deleting old histories to manage Cache Size
//   activeSessionHistoryCache.delete(sessionId);
//   activeSessionHistoryCache.set(sessionId, historyInstance);

//   return historyInstance;
// };

// export const clearCache = (sessionId: string) => {
//   activeSessionHistoryCache.delete(sessionId);
// };
