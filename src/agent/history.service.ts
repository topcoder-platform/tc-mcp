import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Conversation,
  ConversationDocument,
} from './models/conversation.schema';

@Injectable()
export class HistoryService {
  constructor(
    @InjectModel(Conversation.name)
    private conversationModel: Model<ConversationDocument>,
  ) {}

  async getHistoryList(
    userId: string,
    filter?: string,
    search?: string,
  ): Promise<any[]> {
    const queryConditions: any[] = [{ userId }];

    if (filter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      queryConditions.push({ updatedAt: { $gte: today } });
    } else if (filter === 'thisWeek') {
      const today = new Date();
      const firstDayOfWeek = today.getDate() - today.getDay();
      const startOfWeek = new Date(today.setDate(firstDayOfWeek));
      startOfWeek.setHours(0, 0, 0, 0);
      queryConditions.push({ updatedAt: { $gte: startOfWeek } });
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const searchTerm = search.trim();
      queryConditions.push({
        messages: {
          $elemMatch: {
            author: 'user',
            content: { $regex: searchTerm, $options: 'i' },
          },
        },
      });
    }

    const finalQuery = { $and: queryConditions };

    const conversations = await this.conversationModel
      .find(finalQuery)
      .sort({ updatedAt: -1 })
      .select('sessionId updatedAt messages')
      .limit(50)
      .exec();

    const history = conversations.map((conv) => ({
      sessionId: conv.sessionId,
      updatedAt: conv.updatedAt,
      title:
        conv.messages.find((m) => m.author === 'user')?.content.substring(0, 50) ||
        'Untitled Chat',
    }));

    return history;
  }

  async getConversationDetails(
    userId: string,
    sessionId: string,
  ): Promise<ConversationDocument | null> {
    return this.conversationModel.findOne({ sessionId, userId }).exec();
  }
}