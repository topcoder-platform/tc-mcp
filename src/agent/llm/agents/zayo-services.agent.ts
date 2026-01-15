import { ChatBedrockConverse } from '@langchain/aws';
import { ENV_CONFIG } from 'src/config';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import {
  SERVICES_INTRO_PROMPT,
  SERVICES_TOOL_PROMPT,
  GENERIC_TIME_HANDLING_PROMPT,
  GENERIC_LARGE_QUERY_PROMPT,
} from './prompts/zayo_system_prompt';
import { createToolCallingAgent, AgentExecutor } from 'langchain/agents';
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
  HumanMessagePromptTemplate,
} from '@langchain/core/prompts';
import { GraphState } from './graph-state';
import { getCurrentTimeTool, getCalendarRangeTool } from '../tools/time.tools';

export const createZayoServiceNode = (
  providedTools: DynamicStructuredTool[],
) => {
  const tools = [...providedTools, getCurrentTimeTool, getCalendarRangeTool];

  const systemPrompt = `
${SERVICES_INTRO_PROMPT}

${SERVICES_TOOL_PROMPT}

${GENERIC_TIME_HANDLING_PROMPT}

${GENERIC_LARGE_QUERY_PROMPT}
`;

  const llm = new ChatBedrockConverse({
    region: ENV_CONFIG.AWS_BEDROCK_REGION,
    model: ENV_CONFIG.AWS_BEDROCK_MODEL_ID,
    streaming: true,
  }).bindTools(tools);

  const systemMessage = new SystemMessage(systemPrompt);

  const zayoServiceToolkitPrompt = ChatPromptTemplate.fromMessages([
    systemMessage,
    new MessagesPlaceholder('chat_history'),
    HumanMessagePromptTemplate.fromTemplate('{input}'),
    new MessagesPlaceholder('agent_scratchpad'),
  ]);

  const agent = createToolCallingAgent({
    llm,
    tools,
    prompt: zayoServiceToolkitPrompt,
  });

  const executor = new AgentExecutor({ agent, tools });

  return async (state: typeof GraphState.State) => {
    const lastMessage = state.messages[state.messages.length - 1];
    const input = lastMessage.content.toString();
    const chat_history = state.messages.slice(0, -1);
    const result = await executor.invoke({ input, chat_history });
    return {
      messages: [
        new HumanMessage({
          content: `[ZayoServiceAgent]: ${result.output}`,
          name: 'ZayoServiceAgent',
        }),
      ],
    };
  };
};
