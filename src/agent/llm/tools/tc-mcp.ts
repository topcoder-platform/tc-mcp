import { DynamicStructuredTool } from '@langchain/core/tools';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import axios, { AxiosInstance } from 'axios';
import { jsonSchemaToZod } from './schemaConverter';
import { ENV_CONFIG } from 'src/config';

export interface TopcoderMcpToolDefinition {
  name: string;
  description: string;
  inputSchema: any;
}

/**
 * A stateful client to interact with the Topcoder MCP Gateway,
 * mimicking the logic from the provided Python example.
 */
@Injectable()
export class TopcoderMCPClient {
  private readonly logger = new Logger(TopcoderMCPClient.name);
  private axiosInstance: AxiosInstance;
  private sessionToken: string;
  private mcpSessionId: string | null = null;
  private tools: DynamicStructuredTool[] = [];

  constructor() {
    this.sessionToken = '';
    this.axiosInstance = axios.create({
      baseURL: `http://localhost:${ENV_CONFIG.PORT}${ENV_CONFIG.API_BASE}/mcp`,
    });
  }

  @OnEvent('server.ready')
  async onServerInit(): Promise<void> {
    try {
      await this.initializeSession();
      await this.refreshTools();
    } catch (e) {
      this.logger.error('TopcoderMCP init error:', e);
    }
  }

  async refreshTools(): Promise<void> {
    const toolDefinitions = await this.listTools();

    const tools = toolDefinitions.map((toolDef) =>
      this.createToolFromDefinition(toolDef),
    );
    this.tools = tools;
  }

  /**
   * Initializes the session with the MCP Gateway and retrieves a temporary mcp-session-id.
   */
  private async initializeSession(): Promise<void> {
    this.logger.log('Initializing MCP session...');
    const payload = {
      jsonrpc: '2.0',
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        clientInfo: { name: 'teams-ai-agent-backend', version: '1.0.0' },
      },
      id: 1,
    };

    try {
      const response = await this.axiosInstance.post('', payload, {
        headers: {
          Accept: 'application/json, text/event-stream',
          'Content-Type': 'application/json',
          'X-MCP-Session': this.sessionToken,
        },
      });

      // The session ID is returned in the headers
      const sessionId = response.headers['mcp-session-id'];
      if (sessionId) {
        this.mcpSessionId = Array.isArray(sessionId) ? sessionId[0] : sessionId;
        this.logger.log(
          `MCP Session Initialized. Session ID: ${this.mcpSessionId}`,
        );
      } else {
        throw new Error(
          'MCP Session ID was not returned in the response headers.',
        );
      }
    } catch (error: any) {
      this.logger.error(
        'Failed to initialize MCP session. URL:',
        this.axiosInstance.defaults.baseURL,
        'Error:',
        error.message,
        'Response:',
        error.response?.data,
        'Status:',
        error.response?.status,
      );
      // Don't throw - allow tool listing to fail gracefully
      this.logger.warn('MCP initialization failed - tools will be empty');
    }
  }

  /**
   * Parses an SSE response string to extract the JSON data.
   */
  private parseSseResponse(sseText: string): any {
    const lines = sseText.trim().split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const dataStr = line.substring(6);
        try {
          return JSON.parse(dataStr);
        } catch {
          continue;
        }
      }
    }
    return null;
  }

  /**
   * This is the primary method to get tools for the agent.
   * @returns An array of DynamicStructuredTool instances.
   */
  getTools(): DynamicStructuredTool[] {
    return this.tools;
  }

  /**
   * Calls a specific tool on the MCP Gateway.
   * @param toolName The name of the tool to call (e.g., 'query-tc-challenges').
   * @param args The arguments for the tool.
   */
  public async callTool(
    toolName: string,
    args: Record<string, any>,
  ): Promise<any> {
    // Lazy-initialize the session if it hasn't been done yet.
    if (!this.mcpSessionId) {
      await this.initializeSession();
    }

    this.logger.log(`Calling MCP tool '${toolName}' with args:`, args);
    const payload = {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args,
      },
      id: Date.now(), // Use a unique ID for each call
    };

    try {
      const response = await this.axiosInstance.post('', payload, {
        headers: {
          Accept: 'application/json, text/event-stream',
          'Content-Type': 'application/json',
          'X-MCP-Session': this.sessionToken,
          'mcp-session-id': this.mcpSessionId,
        },
      });

      const parsedData = this.parseSseResponse(response.data);
      if (parsedData?.error) {
        throw new Error(
          `MCP returned an error: ${JSON.stringify(parsedData.error)}`,
        );
      }

      return parsedData?.result?.content;
    } catch (error: any) {
      this.logger.error(
        `Error calling MCP tool '${toolName}':`,
        error.response?.data || error.message,
      );
      return `Error: Failed to execute tool '${toolName}'.`;
    }
  }

  private createToolFromDefinition(
    toolDef: TopcoderMcpToolDefinition,
  ): DynamicStructuredTool {
    const schema = jsonSchemaToZod(toolDef.inputSchema);

    return new DynamicStructuredTool({
      name: toolDef.name,
      description: toolDef.description,
      schema: schema as any,
      func: async (input: any) => {
        try {
          const result = await this.callTool(toolDef.name, input);
          return JSON.stringify(result);
        } catch (error: any) {
          return `Error executing tool '${toolDef.name}': ${error.message}`;
        }
      },
    });
  }

  /**
   * Fetches the list of raw tool definitions from the MCP Gateway.
   */
  public async listTools(): Promise<any[]> {
    if (!this.mcpSessionId) {
      await this.initializeSession();
    }
    this.logger.log('Listing MCP tools...');
    const payload = {
      jsonrpc: '2.0',
      method: 'tools/list',
      params: {},
      id: Date.now(),
    };
    try {
      const response = await this.axiosInstance.post('', payload, {
        headers: {
          Accept: 'application/json, text/event-stream',
          'Content-Type': 'application/json',
          'X-MCP-Session': this.sessionToken,
          'mcp-session-id': this.mcpSessionId,
        },
      });
      const parsedData = this.parseSseResponse(response.data);
      if (parsedData?.error) {
        throw new Error(
          `MCP returned an error: ${JSON.stringify(parsedData.error)}`,
        );
      }
      const tools = parsedData?.result?.tools || [];
      this.logger.log(`Found ${tools.length} tools from MCP Gateway.`);

      return tools;
    } catch (error: any) {
      this.logger.error('Error listing MCP tools:', error.message);
      return [];
    }
  }

  /**
   * Transforms a flat JSON schema from the MCP into a nested, LLM-optimized
   * schema by grouping filtering parameters under a 'filter' object.
   * @param originalSchema The raw inputSchema from tc-tools.json.
   * @returns A new schema object optimized for LLM reasoning.
   */
  private transformMcpSchemaForLLM(originalSchema: any): any {
    // Define which keys should be considered 'filters' vs. top-level controls
    const filterKeys = new Set([
      'id',
      'status',
      'type',
      'track',
      'tag',
      'tags',
      'search',
      'startDateStart',
      'startDateEnd',
      'currentPhaseName',
      'totalPrizesFrom',
      'totalPrizesTo',
      'createdBy',
    ]);

    const topLevelKeys = new Set(['page', 'perPage', 'sortBy', 'sortOrder']);

    // Start building the new, nested schema
    const newSchema: any = {
      type: 'object',
      properties: {
        // Define the top-level properties first
        // We will populate them from the original schema
      },
    };

    const filterObject: any = {
      type: 'object',
      description:
        'A comprehensive set of filters to apply to the query. Combine multiple filters to narrow down results.',
      properties: {},
    };

    // Iterate over the properties of the original schema
    for (const key in originalSchema.properties) {
      const prop = originalSchema.properties[key];

      if (filterKeys.has(key)) {
        // If it's a filter key, add it to the nested filter object
        filterObject.properties[key] = prop;
      } else if (topLevelKeys.has(key)) {
        // If it's a top-level control key, add it to the new schema's top level
        newSchema.properties[key] = prop;
      }
    }

    // Only add the filter object to the new schema if it has any properties
    if (Object.keys(filterObject.properties).length > 0) {
      newSchema.properties.filter = filterObject;
    }

    return newSchema;
  }
}

export const tcMcpClient = new TopcoderMCPClient();
