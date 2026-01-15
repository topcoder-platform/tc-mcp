import { createToolCallingAgent, AgentExecutor } from 'langchain/agents';
import { ChatBedrockConverse } from '@langchain/aws';
import { ENV_CONFIG } from 'src/config';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { buildAgentPrompt } from './prompts/tc_system_prompt';
import { GraphState } from './graph-state';
import { HumanMessage } from '@langchain/core/messages';

export const createTopcoderNode = (tools: DynamicStructuredTool[]) => {
  const tcPrompt = buildAgentPrompt();
  const tcLlm = new ChatBedrockConverse({
    region: ENV_CONFIG.AWS_BEDROCK_REGION,
    model: ENV_CONFIG.AWS_BEDROCK_MODEL_ID,
    streaming: true,
  }).bindTools(tools);
  
  const tcAgent = createToolCallingAgent({
    llm: tcLlm,
    tools: tools,
    prompt: tcPrompt,
  });
  
  const tcExecutor = new AgentExecutor({ agent: tcAgent, tools: tools });

  return async (state: typeof GraphState.State) => {
    const lastMessage = state.messages[state.messages.length - 1];
    const input = lastMessage.content.toString();
    const chat_history = state.messages.slice(0, -1);
    
    const result = await tcExecutor.invoke({ input, chat_history });
    
    return {
      messages: [
        new HumanMessage({ content: `[TopcoderAgent]: ${result.output}`, name: 'TopcoderAgent' }),
      ],
    };
  };
};
