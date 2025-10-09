import { Injectable, MessageEvent } from '@nestjs/common';
import { Observable, Observer } from 'rxjs';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { LlmService } from './llm';
import { MemoryService } from './memory.service';

@Injectable()
export class AgentService {
  constructor(
    private readonly memoryService: MemoryService,
    private readonly llmService: LlmService
  ) {}

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

  const onClose = () => {
    console.log(
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
    const agent = this.llmService.createConversationalAgent(userId);
    const stream = agent.streamEvents(
      { input: prompt, chat_history },
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
          console.log(
            `[Server] Client disconnected for session ${sessionId}. Breaking agent loop.`,
          );
          serverAbortController.abort();
        }
        break;
      }

      if (!event.data) continue;
      const data = event.data;

      switch (event.event) {
        case 'on_chat_model_stream': {
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
              accumulatedOutput += ` {{${event.name}}} `;
              tool_results.push({
                toolName: event.name,
                data: JSON.parse(data.output)?.content,
              });
              res.write(
                `event: message\ndata: ${JSON.stringify({
                  type: 'tool_result',
                  content: tool_results,
                })}\n\n`,
              );
              res.write(
                `event: message\ndata: ${JSON.stringify({
                  type: 'chunk',
                  content: `{{${event.name}}}`,
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
      console.log(
        `[Server] Agent execution aborted for session ${sessionId}.`,
      );
    } else {
      console.error('Error during agent execution:', error);
      this.memoryService.clearCache(sessionId);

      if (!res.writableEnded) {
        const friendlyError =
          "I'm sorry, an unexpected error occurred. Please try again.";
        const errorMessage = JSON.stringify({
          type: 'error',
          content: friendlyError,
        });
        res.write(`event: error\ndata: ${errorMessage}\n\n`);
        serverAbortController.abort();
      }
    }
  } finally {
    if (!serverAbortController.signal.aborted) {
      console.log(`[Server] Saving conversation for session ${sessionId}.`);

      if (memory) {
        await memory.addUserMessage(prompt);
        await memory.addAIChatMessage(
          JSON.stringify({ accumulatedOutput, tool_results }),
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
}