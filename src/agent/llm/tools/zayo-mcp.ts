import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ENV_CONFIG } from 'src/config';
import axios, { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { jsonSchemaToZod } from './schemaConverter';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class ZayoMcpClient {
  private readonly logger = new Logger(ZayoMcpClient.name);
  private readonly client: AxiosInstance;
  private readonly isEnabled: boolean;
  private readonly serverUrl: string;
  private readonly mgmtUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;

  private token?: string;
  private sessionId?: string;
  private tools: DynamicStructuredTool[] = [];
  private isInitialized = false;
  private requestCounter = 0;

  constructor() {
    this.isEnabled = ENV_CONFIG.ZAYO_MCP_ENABLED;
    this.serverUrl = ENV_CONFIG.ZAYO_MCP_SERVER_URL; // e.g., http://localhost:8012
    this.mgmtUrl = ENV_CONFIG.ZAYO_MCP_MGMT_URL; // e.g., http://localhost:8011
    this.clientId = ENV_CONFIG.ZAYO_MCP_CLIENT_ID; // MCP User client ID
    this.clientSecret = ENV_CONFIG.ZAYO_MCP_CLIENT_SECRET; // MCP User client secret
    this.client = axios.create({
      baseURL: this.serverUrl,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      responseType: 'text',
    });
  }

  @OnEvent('server.ready')
  async onServerInit(): Promise<void> {
    if (!this.isEnabled) {
      this.logger.log('Zayo MCP is disabled');
      return;
    }
    await this.refreshToken();
    await this.initializeMcpSession();
    await this.refreshTools();
  }

  private async refreshToken(): Promise<void> {
    this.logger.log('Fetching MCP token...');
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', this.clientId);
    params.append('client_secret', this.clientSecret);

    const response = await axios.post(
      `${this.mgmtUrl}/oauth/token`,
      params.toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      },
    );

    this.token = response.data.access_token;
    this.logger.log('MCP token acquired');
  }

  private async initializeMcpSession(): Promise<void> {
    this.logger.log(`Initializing MCP session with server: ${this.serverUrl}`);

    await this.sendJsonRpc('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {}, prompts: {}, resources: {} },
      clientInfo: { name: 'NestJS-Agent', version: '1.0' },
    });

    this.isInitialized = true;
    this.logger.log('MCP session initialized');
  }

  async refreshTools(): Promise<void> {
    if (!this.isEnabled || !this.token) return;

    if (!this.isInitialized) {
      await this.initializeMcpSession();
    }
    const result = await this.sendJsonRpc('tools/list', {});
    const toolsList = result?.tools || [];

    this.logger.log(`Found ${toolsList.length} Zayo tools`);
    this.tools = toolsList.map((tool: any) => {
      const schema = jsonSchemaToZod(tool.inputSchema);
      return new DynamicStructuredTool({
        name: tool.name,
        description: tool.description,
        schema: schema as any,
        func: async (args) => this.callTool(tool.name, args),
      });
    });
  }

  getTools(): DynamicStructuredTool[] {
    return this.tools;
  }

  getServiceTools(): DynamicStructuredTool[] {
    const serviceKeywords = [
      'get_services',
      'ticket',
      'resolution',
      'maintenance',
      'status',
      'nni',
    ];
    return this.tools.filter(
      (t) =>
        serviceKeywords.some((k) => t.name.includes(k)) &&
        !t.name.includes('quote'),
    );
  }

  getQuoteTools(): DynamicStructuredTool[] {
    const quoteKeywords = ['quote', 'address', 'location'];
    return this.tools.filter((t) =>
      quoteKeywords.some((k) => t.name.includes(k)),
    );
  }

  async callTool(name: string, args: any): Promise<string> {
    if (!this.isEnabled) throw new Error('Zayo MCP is disabled');
    this.logger.log(`Calling tool: ${name}\n${JSON.stringify(args)}`);

    try {
      const result = await this.sendJsonRpc('tools/call', {
        name,
        arguments: args || {},
      });

      if ('error' in result) {
        const errorMsg = JSON.stringify(result.error);
        // Truncate massive error messages (e.g., validation errors with 100k+ lines)
        if (errorMsg.length > 2000) {
          const truncated = errorMsg.substring(0, 2000);
          this.logger.error(
            `Tool ${name} returned large error (${errorMsg.length} chars), truncated to 2000 chars`,
          );
          // Return error as JSON so LLM can read it
          return JSON.stringify({
            error: true,
            message: 'Tool returned a large error response that was truncated',
            details: truncated,
            note: 'Error message was too long and has been truncated',
          });
        }
        // Return error as JSON instead of throwing
        this.logger.error(`Tool ${name} error:`, result.error);
        return JSON.stringify({
          error: true,
          message: 'Tool execution failed',
          details: result.error,
        });
      }

      const content = result?.structuredContent || result?.content || [];
      const serialized = JSON.stringify(content);

      // Warn about large successful responses
      if (serialized.length > 100000) {
        this.logger.warn(
          `Tool ${name} returned large response (${serialized.length} chars), may cause context issues`,
        );
      }

      return serialized;
    } catch (error: any) {
      // Catch network errors or other exceptions
      this.logger.error(`Tool ${name} exception:`, error);
      return JSON.stringify({
        error: true,
        message: 'An error occurred while calling the tool',
        details: error.message,
      });
    }
  }

  private async sendJsonRpc(method: string, params: any): Promise<any> {
    const requestId = ++this.requestCounter;
    const payload = { jsonrpc: '2.0', id: requestId, method, params };
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      Authorization: `Bearer ${this.token}`,
    };
    if (this.sessionId) headers['Mcp-Session-Id'] = this.sessionId;

    let response;
    const maxRetries = 3;
    const retryDelay = 3000; // 3 seconds

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        response = await this.client.post('/mcp', payload, { headers });
        break; // Success, exit loop
      } catch (error: any) {
        const isLastAttempt = attempt === maxRetries;
        const status = error.response?.status;

        // Check for 502 Bad Gateway (Cold Start)
        if (status === 502 && !isLastAttempt) {
          this.logger.warn(
            `Received 502 Bad Gateway from MCP server. Server might be waking up (Cold Start). Retrying attempt ${attempt}/${maxRetries} in ${retryDelay}ms...`,
          );
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          continue;
        }

        // For other errors or last attempt, log and throw
        if (axios.isAxiosError(error)) {
          this.logger.error(
            `MCP RPC Error for ${method}: ${error.message}. Target: ${error.config?.baseURL}${error.config?.url}`,
          );
          if (error.response) {
            this.logger.error(`Status: ${error.response.status}`);
            this.logger.error(
              `Response Data: ${JSON.stringify(error.response.data)}`,
            );
          }
        }
        throw error;
      }
    }
    // Capture session ID
    const newSid = response.headers['mcp-session-id'];
    if (newSid) this.sessionId = newSid;
    // Parse SSE response
    if (typeof response.data === 'string') {
      for (const line of response.data.split('\n')) {
        if (line.startsWith('data:')) {
          const json = line.substring(5).trim();
          if (!json) continue;
          const msg = JSON.parse(json);
          if (msg.error) throw new Error(`MCP Error: ${msg.error.message}`);
          return msg.result;
        }
      }
    }
    return null;
  }
}
