import { BaseChatMessageHistory } from "@langchain/core/chat_history";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from 'mongoose';
import { Conversation, ConversationDocument } from "./models/conversation.schema";
import { CachedChatHistory, MongoDBChatHistory } from "./llm/memory";

@Injectable()
export class MemoryService {
  private activeSessionHistoryCache = new Map<string, CachedChatHistory>();
  private MAX_CACHE_SIZE = 500;

  constructor(
    @InjectModel(Conversation.name)
    private conversationModel: Model<ConversationDocument>,
  ) {}

  private manageCacheSize() {
    if (this.activeSessionHistoryCache.size > this.MAX_CACHE_SIZE) {
      const oldestKey = this.activeSessionHistoryCache.keys().next().value;
      if (oldestKey) this.activeSessionHistoryCache.delete(oldestKey);
    }
  }

  getSessionMemory(sessionId: string, userId: string): BaseChatMessageHistory {
  if (!this.activeSessionHistoryCache.has(sessionId)) {
    const dbHistory = new MongoDBChatHistory(sessionId, userId, this.conversationModel);
    const cachedHistory = new CachedChatHistory(dbHistory);
    this.activeSessionHistoryCache.set(sessionId, cachedHistory);
    this.manageCacheSize();
  }

  const historyInstance = this.activeSessionHistoryCache.get(sessionId)!;

  // Delete & Set again to push it to newest because of we are deleting old histories to manage Cache Size
  this.activeSessionHistoryCache.delete(sessionId);
  this.activeSessionHistoryCache.set(sessionId, historyInstance);

  return historyInstance;
};

  clearCache(sessionId: string) {
    this.activeSessionHistoryCache.delete(sessionId);
  }
}