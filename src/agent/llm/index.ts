import { AgentExecutor, createToolCallingAgent } from 'langchain/agents';
import { buildAgentPrompt } from './prompts';
import { TopcoderMCPClient } from './tc-mcp';
import { ChatBedrockConverse } from '@langchain/aws';
import { ENV_CONFIG } from 'src/config';
import { Injectable } from '@nestjs/common';

/**
 * Creates a new conversational agent instance for a specific user.
 * This function is called for each incoming request.
 * @param userId The unique ID of the user making the request.
 * @returns A fully configured runnable agent chain with memory.
 */
@Injectable()
export class LlmService {
  constructor(private readonly tcMcpClient: TopcoderMCPClient) {}

  createConversationalAgent(userId: string) {
    const tools = this.tcMcpClient.getTools();
    const prompt = buildAgentPrompt();

    const llm = new ChatBedrockConverse({
      region: ENV_CONFIG.AWS_BEDROCK_REGION,
      model: ENV_CONFIG.AWS_BEDROCK_MODEL_ID,

      streaming: true,
    }).bindTools(tools);

    const agent = createToolCallingAgent({ llm, tools, prompt });
    const agentExecutor = new AgentExecutor({ agent, tools });

    return agentExecutor;
  }
}
