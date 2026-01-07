import { ChatBedrockConverse } from '@langchain/aws';
import { ENV_CONFIG } from 'src/config';
import { SystemMessage } from "@langchain/core/messages";
import { GraphState } from '../graph-state';
import { z } from 'zod';

export const createSupervisorNode = () => {
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
        // This prevents the Supervisor from "talking" (streaming "FINISH") or trying to route again.
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
        const response = await llmWithTool.invoke(messages);

        const toolCall = response.tool_calls?.[0];
        
        // If the LLM decided to answer directly (no tool call), or if it wants to finish:
        if (!toolCall) {
            // Return the supervisor's text response as a message so the user sees it
            return { messages: [response], next: 'FINISH' };
        }
        return { next: toolCall.args.next };
    };
};
