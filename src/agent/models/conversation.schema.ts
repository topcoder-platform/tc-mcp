import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema()
export class Message {
  @Prop({ required: true, enum: ['user', 'bot', 'system'] })
  author: 'user' | 'bot' | 'system';

  @Prop({ required: true })
  content: string;

  @Prop({ type: Date, default: Date.now })
  timestamp: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
export type ConversationDocument = HydratedDocument<Conversation>;

@Schema({ timestamps: true })
export class Conversation {
  @Prop({ required: true, index: true })
  userId: string; // The 'oid' from the user's Azure AD token

  @Prop({ required: true, unique: true, index: true })
  sessionId: string;

  // This defines an array of Message sub-documents.
  @Prop({ type: [MessageSchema] })
  messages: Message[];

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);