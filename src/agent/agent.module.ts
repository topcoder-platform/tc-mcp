import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AgentController } from './agent.controller';
import { HistoryController } from './history.controller';
import { AgentService } from './agent.service';
import { HistoryService } from './history.service';
import { Conversation, ConversationSchema } from './models/conversation.schema';
import { MemoryService } from './memory.service';
import { TopcoderMCPClient } from './llm/tc-mcp';
import { ToolsService } from 'src/mcp/tools/tools.service';
import { LlmService } from './llm';
import { ToolsModule } from 'src/mcp/tools/tools.module';

@Module({
  imports: [
    ToolsModule,
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
    ]),
  ],
  controllers: [AgentController, HistoryController],
  providers: [
    TopcoderMCPClient,
    AgentService,
    HistoryService,
    LlmService,
    MemoryService,
    ToolsService,
  ],
})
export class AgentModule {}