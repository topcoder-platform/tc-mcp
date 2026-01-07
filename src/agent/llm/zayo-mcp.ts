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
    this.serverUrl = ENV_CONFIG.ZAYO_MCP_SERVER_URL;           // e.g., http://localhost:8012
    this.mgmtUrl = ENV_CONFIG.ZAYO_MCP_MGMT_URL;               // e.g., http://localhost:8011
    this.clientId = ENV_CONFIG.ZAYO_MCP_CLIENT_ID;             // MCP User client ID
    this.clientSecret = ENV_CONFIG.ZAYO_MCP_CLIENT_SECRET;     // MCP User client secret
    this.client = axios.create({
      baseURL: this.serverUrl,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
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
    
    const response = await axios.post(`${this.mgmtUrl}/oauth/token`, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    
    this.token = response.data.access_token;
    this.logger.log('MCP token acquired');
  }
  private async initializeMcpSession(): Promise<void> {
    this.logger.log('Initializing MCP session...');
    
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
  async callTool(name: string, args: any): Promise<string> {
    if (!this.isEnabled) throw new Error('Zayo MCP is disabled');
    this.logger.log(`Calling tool: ${name}`);
    const result = await this.sendJsonRpc('tools/call', {
      name,
      arguments: args || {},
    });
    const content = result?.content?.[0];
    if (content?.type === 'text') return content.text;
    return JSON.stringify(result);
  }
  private async sendJsonRpc(method: string, params: any): Promise<any> {
    const requestId = ++this.requestCounter;
    const payload = { jsonrpc: '2.0', id: requestId, method, params };
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      Authorization: `Bearer ${this.token}`,
    };
    if (this.sessionId) headers['Mcp-Session-Id'] = this.sessionId;
    const response = await this.client.post('/mcp', payload, { headers });
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