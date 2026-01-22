import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AgentController } from './agent.controller';
import { HistoryController } from './history.controller';
import { AgentService } from './agent.service';
import { HistoryService } from './history.service';
import { Conversation, ConversationSchema } from './models/conversation.schema';
import { MemoryService } from './memory.service';
import { TopcoderMCPClient } from './llm/tools/tc-mcp';
import { ZayoMcpClient } from './llm/tools/zayo-mcp';
import { LlmService } from './llm';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
    ]),
  ],
  controllers: [AgentController, HistoryController],
  providers: [
    AgentService,
    HistoryService,
    LlmService,
    MemoryService,
    TopcoderMCPClient,
    ZayoMcpClient,
  ],
})
export class AgentModule implements OnModuleInit {
  private readonly logger = new Logger(AgentModule.name);

  onModuleInit() {
    this.logger.log('AgentModule initialized');
  }
}
