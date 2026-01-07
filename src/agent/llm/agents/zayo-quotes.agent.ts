import { ChatBedrockConverse } from '@langchain/aws';
import { ENV_CONFIG } from 'src/config';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { 
  QUOTE_INTRO_PROMPT, 
  QUOTE_TOOL_PROMPT, 
  GENERIC_TIME_HANDLING_PROMPT 
} from '../zayo_system_prompt';
import { createToolCallingAgent, AgentExecutor } from 'langchain/agents';
import { ChatPromptTemplate, MessagesPlaceholder, HumanMessagePromptTemplate } from "@langchain/core/prompts";
import { GraphState } from '../graph-state';

export const createZayoQuoteNode = (tools: DynamicStructuredTool[]) => {
  const systemPrompt = `
${QUOTE_INTRO_PROMPT}

${QUOTE_TOOL_PROMPT}

${GENERIC_TIME_HANDLING_PROMPT}
`;

  const llm = new ChatBedrockConverse({
    region: ENV_CONFIG.AWS_BEDROCK_REGION,
    model: ENV_CONFIG.AWS_BEDROCK_MODEL_ID,
    streaming: true,
  }).bindTools(tools);

  const systemMessage = new SystemMessage(systemPrompt);
  
  const zayoQuoteToolkitPrompt = ChatPromptTemplate.fromMessages([
      systemMessage,
      new MessagesPlaceholder("chat_history"),
      HumanMessagePromptTemplate.fromTemplate("{input}"),
      new MessagesPlaceholder("agent_scratchpad"),
  ]);
  
  const agent = createToolCallingAgent({ 
      llm, 
      tools, 
      prompt: zayoQuoteToolkitPrompt 
  });
  
  const executor = new AgentExecutor({ agent, tools });

  return async (state: typeof GraphState.State) => {
      const lastMessage = state.messages[state.messages.length - 1];
      const input = lastMessage.content.toString();
      const chat_history = state.messages.slice(0, -1);
      const result = await executor.invoke({ input, chat_history });
      return { 
          messages: [new HumanMessage({ content: `[ZayoQuoteAgent]: ${result.output}`, name: "ZayoQuoteAgent" })] 
      };
  };
};
