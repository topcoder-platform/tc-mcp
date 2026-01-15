import { ChatBedrockConverse } from '@langchain/aws';
import { Logger } from '@nestjs/common';
import { ENV_CONFIG } from 'src/config';
import { SystemMessage } from '@langchain/core/messages';
import { GraphState } from './graph-state';
import { z } from 'zod';

export const createSupervisorNode = () => {
  const logger = new Logger('SupervisorAgent');
  const members = [
    'TopcoderAgent',
    'ZayoServiceAgent',
    'ZayoQuoteAgent',
  ] as const;

  const systemPrompt = `You are a supervisor tasked with managing a conversation between the following workers: ${members.join(', ')}. 
Given the following user request, respond with the worker to act next. Each worker will perform a task and respond with their results and status.
When finished, respond with FINISH.

- TopcoderAgent: Handles Topcoder challenges and skills.
- ZayoServiceAgent: Handles information about existing Zayo services, tickets, and maintenance.
- ZayoQuoteAgent: Handles Zayo quotes, orders, and location validation.


STRICT OUTPUT RULES:
1. If you determine a worker needed: **IMMEDIATELY** call the \`route\` tool. **DO NOT** output any text, reasoning, or explanation before calling the tool.
   - INCORRECT: "I need to check Topcoder skills. [Tool Call]"
   - CORRECT: "[Tool Call]"
2. If the user asks a general question (e.g. "What can you do?", "Who are you?"): Answer conciseley in plain text and **DO NOT** call the tool.
3. CRITICAL: If the user asks for details about a specific domain (e.g. "Tell me about Zayo services", "Accout Topcoder", "How do quotes work?"), YOU MUST ROUTE to the appropriate worker. DO NOT answer these yourself.
4. If the LAST message start with a Worker prefix (e.g. "[TopcoderAgent]:"): Respond with the text "FINISH" and **DO NOT** call the tool.
`;

  const supervisorLlm = new ChatBedrockConverse({
    region: ENV_CONFIG.AWS_BEDROCK_REGION,
    model: ENV_CONFIG.AWS_BEDROCK_MODEL_ID,
    streaming: true,
  });

  const routeTool = {
    name: 'route',
    description: 'Select the next role.',
    schema: z.object({
      next: z.enum([...members, 'FINISH']),
    }),
  };

  return async (state: typeof GraphState.State) => {
    // 1. Strict Loop Prevention (Deterministic)
    // If the last message is from a worker, we stop immediately.
    const lastMessage = state.messages[state.messages.length - 1];
    if (
      lastMessage &&
      (lastMessage.name === 'TopcoderAgent' ||
        lastMessage.name === 'ZayoServiceAgent' ||
        lastMessage.name === 'ZayoQuoteAgent')
    ) {
      return { next: 'FINISH' };
    }

    const messages = [new SystemMessage(systemPrompt), ...state.messages];
    const llmWithTool = supervisorLlm.bindTools([routeTool]);

    // Retry loop for invalid routing
    const MAX_RETRIES = 2;
    let attempt = 0;
    let nextDestination: string | undefined;

    while (attempt < MAX_RETRIES) {
      attempt++;

      try {
        const response = await llmWithTool.invoke(messages);
        const toolCall = response.tool_calls?.[0];

        // If the LLM decided to answer directly (no tool call):
        if (!toolCall) {
          // Return the supervisor's text response as a message
          return { messages: [response], next: 'FINISH' };
        }

        // Extract the next destination from tool call
        nextDestination = toolCall.args?.next;

        // If valid destination found, break out of retry loop
        if (
          nextDestination &&
          [
            'TopcoderAgent',
            'ZayoServiceAgent',
            'ZayoQuoteAgent',
            'FINISH',
          ].includes(nextDestination)
        ) {
          return { next: nextDestination };
        }

        // Invalid destination - log and retry
        logger.warn(
          `[Supervisor] Attempt ${attempt}/${MAX_RETRIES}: Invalid 'next' value: ${nextDestination}`,
        );

        if (attempt < MAX_RETRIES) {
          // Add a clarification message to help the LLM
          messages.push(
            new SystemMessage(
              `ERROR: You must call the 'route' tool with a valid 'next' value: TopcoderAgent, ZayoServiceAgent, ZayoQuoteAgent, or FINISH. Please try again.`,
            ),
          );
        }
      } catch (error) {
        logger.error(`[Supervisor] Error on attempt ${attempt}:`, error);
        if (attempt === MAX_RETRIES) {
          throw error; // Re-throw on final attempt
        }
      }
    }

    // All retries exhausted - default to FINISH
    logger.error(
      `[Supervisor] All ${MAX_RETRIES} attempts failed. Invalid or missing 'next' value: ${nextDestination}. Defaulting to FINISH.`,
    );
    return { next: 'FINISH' };
  };
};
