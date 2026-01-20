import { Injectable, MessageEvent, Logger } from '@nestjs/common';
import { Observable, Observer } from 'rxjs';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { LlmService } from './llm';
import { MemoryService } from './memory.service';
import { HumanMessage } from '@langchain/core/messages';

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);

  constructor(
    private readonly memoryService: MemoryService,
    private readonly llmService: LlmService,
  ) {}

  getTools() {
    const tools = this.llmService.getTools();
    return tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
    }));
  }

  async runAgent(
    prompt: string,
    userId: string,
    req: Request,
    res: Response,
    existingSessionId?: string,
  ): Promise<void> {
    const serverAbortController = new AbortController();
    const sessionId = existingSessionId || uuidv4();
    const memory = this.memoryService.getSessionMemory(sessionId, userId);
    const chat_history = await memory.getMessages();
    const tool_results: any[] = [];
    let accumulatedOutput = '';
    let finalAgentName = '';
    let hasSpecializedAgentResponded = false;

    const onClose = () => {
      this.logger.log(
        `[Server] Client disconnected for session ${sessionId}. Aborting agent execution.`,
      );
      serverAbortController.abort();
    };

    req.on('close', onClose);
    res.on('close', onClose);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
      const agent = await this.llmService.createConversationalAgent(userId);

      // Convert legacy input to GraphState messages
      const messages = [...chat_history, new HumanMessage(prompt)];

      const stream = await agent.streamEvents(
        { messages },
        {
          version: 'v2',
          configurable: {
            sessionId,
            signal: serverAbortController.signal,
          },
        },
      );

      res.write(
        `event: session_start\ndata: ${JSON.stringify({ sessionId })}\n\n`,
      );

      for await (const event of stream) {
        if (res.closed) {
          if (!serverAbortController.signal.aborted) {
            this.logger.log(
              `[Server] Client disconnected for session ${sessionId}. Breaking agent loop.`,
            );
            serverAbortController.abort();
          }
          break;
        }

        if (!event.data) continue;
        const data = event.data;
        let shouldSuppressChunk = false;

        switch (event.event) {
          case 'on_chat_model_stream': {
            if (event.metadata?.langgraph_node) {
              const { updatedState, suppressChunk } = this.updateAgentState(
                event.metadata.langgraph_node,
                {
                  accumulatedOutput,
                  hasSpecializedAgentResponded,
                  finalAgentName,
                },
              );

              finalAgentName = updatedState.finalAgentName;
              accumulatedOutput = updatedState.accumulatedOutput;
              hasSpecializedAgentResponded =
                updatedState.hasSpecializedAgentResponded;
              shouldSuppressChunk = suppressChunk;
            }

            // Debug: Log all stream events to trace why Supervisor direct answers aren't arriving
            this.logger.log(
              `[Stream] Node: ${event.metadata?.langgraph_node}, Suppress: ${shouldSuppressChunk}, HasSpecialized: ${hasSpecializedAgentResponded}`,
            );

            if (shouldSuppressChunk) break;

            const chunk = event.data.chunk;
            if (
              chunk?.content &&
              typeof chunk.content === 'string' &&
              chunk.content.length > 0
            ) {
              accumulatedOutput += chunk.content;
              res.write(
                `event: message\ndata: ${JSON.stringify({
                  type: 'chunk',
                  content: chunk.content,
                  agentName: event.metadata?.langgraph_node,
                })}\n\n`,
              );
            }
            break;
          }

          case 'on_tool_start': {
            if (
              event.name &&
              typeof event.name === 'string' &&
              event.name.length > 0
            ) {
              res.write(
                `event: message\ndata: ${JSON.stringify({
                  type: 'tool_start',
                  content: event.name,
                  agentName: event.metadata?.langgraph_node,
                })}\n\n`,
              );
            }
            break;
          }

          case 'on_tool_end': {
            if (
              event.name &&
              typeof event.name === 'string' &&
              event.name.length > 0
            ) {
              if (data && typeof data === 'object' && 'output' in data) {
                const toolContent = this.parseToolContent(data, event);

                accumulatedOutput += ` {{${event.name}}} `;
                tool_results.push({
                  toolName: event.name,
                  data: toolContent,
                });
                res.write(
                  `event: message\ndata: ${JSON.stringify({
                    type: 'chunk',
                    content: `{{${event.name}}}`,
                    agentName: event.metadata?.langgraph_node,
                  })}\n\n`,
                );
                res.write(
                  `event: message\ndata: ${JSON.stringify({
                    type: 'tool_result',
                    content: tool_results,
                    agentName: event.metadata?.langgraph_node,
                  })}\n\n`,
                );
              }
            }
            break;
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError' || error === 'Aborted') {
        this.logger.log(
          `[Server] Agent execution aborted for session ${sessionId}.`,
        );
      } else {
        this.logger.error('Error during agent execution:', error);
        this.memoryService.clearCache(sessionId);

        if (!res.writableEnded) {
          // Determine user-friendly error message based on error type
          let friendlyError =
            "I'm sorry, an unexpected error occurred. Please try again.";

          if (error.message?.includes('Input is too long')) {
            friendlyError =
              'The conversation history is too long. Please start a new conversation.';
          } else if (error.message?.includes('validation')) {
            friendlyError =
              'There was an issue with the data format. Please try rephrasing your request.';
          } else if (error.message?.includes('Branch condition')) {
            friendlyError =
              'There was a routing error. Please try again or rephrase your request.';
          } else if (error.$metadata?.httpStatusCode === 400) {
            friendlyError =
              'Invalid request to the AI service. Please try a different query.';
          } else if (error.$metadata?.httpStatusCode >= 500) {
            friendlyError =
              'The AI service is temporarily unavailable. Please try again later.';
          }

          const errorMessage = JSON.stringify({
            type: 'error',
            content: friendlyError,
            details: error.message, // Include technical details for debugging
          });
          res.write(`event: error\ndata: ${errorMessage}\n\n`);
          serverAbortController.abort();
        }
      }
    } finally {
      if (!serverAbortController.signal.aborted) {
        this.logger.log(
          `[Server] Saving conversation for session ${sessionId}.`,
        );

        if (memory) {
          await memory.addUserMessage(prompt);
          await memory.addAIChatMessage(
            JSON.stringify({
              accumulatedOutput,
              tool_results,
              agentName: finalAgentName,
            }),
          );
        }
      }

      req.removeListener('close', onClose);
      res.removeListener('close', onClose);

      if (!res.writableEnded) {
        res.write(`event: end\ndata: {}\n\n`);
        res.end();
      }
    }
  }

  parseToolContent(data: any, event: any) {
    this.logger.log(
      `Tool ${event.name} - Raw data.output type: ${typeof data.output}`,
    );
    this.logger.log(
      `Tool ${event.name} - Raw data.output: ${JSON.stringify(data.output).substring(0, 500)}`,
    );

    let toolContent = data.output;

    // If output is a string that looks like JSON, try to parse it.
    if (typeof toolContent === 'string') {
      try {
        if (
          toolContent.trim().startsWith('{') ||
          toolContent.trim().startsWith('[')
        ) {
          toolContent = JSON.parse(toolContent);
          this.logger.log(`Tool ${event.name} - Parsed string to object`);
        }
      } catch (e) {
        this.logger.log(`Tool ${event.name} - Failed to parse: ${e.message}`);
      }
    }

    // Handle Zayo MCP structure: {content: [], structuredContent: {...data...}, isError: false}
    // OR: {content: [...], metadata: {...}, isError: false}
    if (
      toolContent &&
      typeof toolContent === 'object' &&
      'isError' in toolContent
    ) {
      this.logger.log(`Tool ${event.name} - Detected Zayo MCP structure`);
      // Check if structuredContent exists and has data (new Zayo format)
      if ('structuredContent' in toolContent && toolContent.structuredContent) {
        this.logger.log(`Tool ${event.name} - Using structuredContent`);
        toolContent = toolContent.structuredContent;
      }
      // Otherwise use content array (old format)
      else if ('content' in toolContent) {
        this.logger.log(`Tool ${event.name} - Using content array`);
        toolContent = toolContent.content;
      }
    } else if (
      toolContent &&
      typeof toolContent === 'object' &&
      'content' in toolContent &&
      !('isError' in toolContent)
    ) {
      // Generic MCP structure without isError (TC tools)
      this.logger.log(`Tool ${event.name} - Detected generic content wrapper`);
      toolContent = toolContent.content;
    }

    this.logger.log(
      `Tool ${event.name} - Final content type: ${typeof toolContent}, isArray: ${Array.isArray(toolContent)}`,
    );

    return toolContent;
  }

  private updateAgentState(
    currentAgent: string,
    state: {
      accumulatedOutput: string;
      hasSpecializedAgentResponded: boolean;
      finalAgentName: string;
    },
  ): {
    updatedState: {
      accumulatedOutput: string;
      hasSpecializedAgentResponded: boolean;
      finalAgentName: string;
    };
    suppressChunk: boolean;
  } {
    const { accumulatedOutput, hasSpecializedAgentResponded, finalAgentName } =
      state;
    let newAccumulatedOutput = accumulatedOutput;
    let newHasSpecializedAgentResponded = hasSpecializedAgentResponded;
    let newFinalAgentName = finalAgentName;
    let shouldSuppressChunk = false;

    const isSupervisor = currentAgent === 'supervisor';

    if (!isSupervisor) {
      // Specialized Agent Logic
      if (!newHasSpecializedAgentResponded) {
        // This is the FIRST text from a specialized agent.
        // Clear any initial "I will check..." chatter from the Supervisor.
        if (newAccumulatedOutput.length > 0) {
          this.logger.log(
            `[Server] Switching to first specialized agent ${currentAgent}. Clearing initial supervisor output.`,
          );
          newAccumulatedOutput = '';
        }
        newHasSpecializedAgentResponded = true;
      }
      newFinalAgentName = currentAgent;
    } else {
      // Supervisor Logic
      if (newHasSpecializedAgentResponded) {
        // If we already have a specialized response, suppress further text from Supervisor
        // to prevent it from overwriting or diluting the specialized answer.
        shouldSuppressChunk = true;
      } else {
        // Supervisor is speaking first (e.g. "Thinking..."). Allow it for now,
        // but it will be cleared if a specialized agent takes over.
        newFinalAgentName = currentAgent;
      }
    }

    return {
      updatedState: {
        accumulatedOutput: newAccumulatedOutput,
        hasSpecializedAgentResponded: newHasSpecializedAgentResponded,
        finalAgentName: newFinalAgentName,
      },
      suppressChunk: shouldSuppressChunk,
    };
  }
}
