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

Your job is to route the CURRENT user request to the appropriate worker. You may see previous messages from workers in the conversation history - IGNORE those when making your routing decision. Focus ONLY on the latest user message.

WORKER CAPABILITIES:
- TopcoderAgent: Handles Topcoder challenges, skills, member information, and job postings.
- ZayoServiceAgent: Handles information about EXISTING Zayo services, tickets, maintenance, and service status.
- ZayoQuoteAgent: Handles NEW Zayo quotes, orders, address validation, and location checks.

ROUTING DECISION RULES (in priority order):
1. If the LAST message is from a worker (has worker name prefix): You MUST respond with text "FINISH" and DO NOT call the route tool.
2. If the user asks a general question about your capabilities (e.g. "What can you do?", "Who are you?"): Answer briefly in plain text and DO NOT call the route tool.
3. For ANY domain-specific request: You MUST call the \`route\` tool with the appropriate worker.

EXAMPLES OF CORRECT ROUTING:
- "Show me zayo services" → Call route tool with ZayoServiceAgent
- "Get topcoder challenges" → Call route tool with TopcoderAgent  
- "I need a quote for dark fiber" → Call route tool with ZayoQuoteAgent
- "Check ticket status for circuit ABC123" → Call route tool with ZayoServiceAgent
- "What can you help me with?" → Respond with text (no tool call)

CRITICAL OUTPUT RULES:
1. When routing to a worker: **IMMEDIATELY** call the \`route\` tool with the \`next\` parameter. DO NOT output any text before the tool call.
2. The \`next\` parameter is REQUIRED and MUST be one of: TopcoderAgent, ZayoServiceAgent, ZayoQuoteAgent, or FINISH.
3. NEVER leave \`next\` undefined or empty.
4. If uncertain which worker to use, default to the most relevant one based on keywords in the user's message.

KEYWORD HINTS:
- Topcoder keywords: challenge, skill, member, gig, job, competition
- Zayo Service keywords: service, ticket, maintenance, status, circuit, existing, account
- Zayo Quote keywords: quote, order, address, location, new, pricing, proposal
`;

  const supervisorLlm = new ChatBedrockConverse({
    region: ENV_CONFIG.AWS_BEDROCK_REGION,
    model: ENV_CONFIG.AWS_BEDROCK_MODEL_ID,
    streaming: true,
  });

  const routeTool = {
    name: 'route',
    description:
      'Route the user request to the appropriate worker. You MUST specify which worker should handle this request in the "next" parameter.',
    schema: z.object({
      next: z
        .enum([...members, 'FINISH'])
        .describe(
          'The worker to route to. REQUIRED. Must be one of: TopcoderAgent, ZayoServiceAgent, ZayoQuoteAgent, or FINISH',
        ),
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
      logger.log('[Supervisor] Last message from worker - returning FINISH');
      return { next: 'FINISH' };
    }

    const messages = [new SystemMessage(systemPrompt), ...state.messages];
    const llmWithTool = supervisorLlm.bindTools([routeTool]);

    // Retry loop for invalid routing
    const MAX_RETRIES = 3; // Increased from 2 to 3
    let attempt = 0;
    let nextDestination: string | undefined;

    while (attempt < MAX_RETRIES) {
      attempt++;

      try {
        const response = await llmWithTool.invoke(messages);
        const toolCall = response.tool_calls?.[0];

        // If the LLM decided to answer directly (no tool call):
        if (!toolCall) {
          logger.log(
            '[Supervisor] No tool call - LLM answered directly, returning FINISH',
          );
          // Return the supervisor's text response as a message
          return { messages: [response], next: 'FINISH' };
        }

        // Extract the next destination from tool call
        nextDestination = toolCall.args?.next;

        // Log the routing decision
        logger.log(
          `[Supervisor] Route decision: ${nextDestination} (attempt ${attempt}/${MAX_RETRIES})`,
        );

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
          `[Supervisor] Attempt ${attempt}/${MAX_RETRIES}: Invalid 'next' value: "${nextDestination}" (type: ${typeof nextDestination})`,
        );

        if (attempt < MAX_RETRIES) {
          // Add a stronger clarification message with examples
          messages.push(
            new SystemMessage(
              `ERROR: Invalid routing decision. The "next" parameter was ${nextDestination === undefined ? 'undefined' : `"${nextDestination}"`}.

You MUST call the 'route' tool with a valid 'next' value from this EXACT list:
- TopcoderAgent
- ZayoServiceAgent  
- ZayoQuoteAgent
- FINISH

Look at the LATEST user message and route to the appropriate worker. DO NOT leave 'next' undefined.`,
            ),
          );
        }
      } catch (error) {
        logger.error(`[Supervisor] Error on attempt ${attempt}:`, error);
        if (attempt === MAX_RETRIES) {
          // On final attempt, default to FINISH instead of throwing
          logger.error(
            '[Supervisor] Max retries reached, defaulting to FINISH',
          );
          return { next: 'FINISH' };
        }
      }
    }

    // All retries exhausted - analyze the last user message for smart default
    const userMessages = state.messages.filter((m) => m._getType() === 'human');
    const lastUserMessage =
      userMessages[userMessages.length - 1]?.content
        ?.toString()
        .toLowerCase() || '';

    let smartDefault: string = 'FINISH';
    if (
      lastUserMessage.includes('topcoder') ||
      lastUserMessage.includes('challenge') ||
      lastUserMessage.includes('skill')
    ) {
      smartDefault = 'TopcoderAgent';
    } else if (
      lastUserMessage.includes('service') ||
      lastUserMessage.includes('ticket') ||
      lastUserMessage.includes('maintenance')
    ) {
      smartDefault = 'ZayoServiceAgent';
    } else if (
      lastUserMessage.includes('quote') ||
      lastUserMessage.includes('order') ||
      lastUserMessage.includes('address')
    ) {
      smartDefault = 'ZayoQuoteAgent';
    }

    logger.error(
      `[Supervisor] All ${MAX_RETRIES} attempts failed. Invalid or missing 'next' value: ${nextDestination}. Using smart default: ${smartDefault}`,
    );
    return { next: smartDefault };
  };
};
