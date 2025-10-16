import { DynamicStructuredTool } from '@langchain/core/tools';
import { ToolsService } from 'src/mcp/tools/tools.service';
import { Injectable } from '@nestjs/common';

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
  private tools: DynamicStructuredTool[] | null = null;

  constructor(private readonly mcpToolsService: ToolsService) {}

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
   * Reads tool definitions from tools.json, generates LangChain tools,
   * and caches them. This is the primary method to get tools for the agent.
   * @returns An array of DynamicStructuredTool instances.
   */
  public getTools(): DynamicStructuredTool[] {
    // If tools are already generated and cached, return them immediately.
    if (this.tools) return this.tools;

    const toolDefinitions = this.mcpToolsService.listTools();

    const tools = toolDefinitions.map((toolDef) =>
      this.createToolFromDefinition(toolDef as any),
    );
    this.tools = tools;
    return tools;
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
    console.log(`Calling MCP tool '${toolName}' directly with args:`, args);
    try {
      // Directly call the service, bypassing HTTP entirely
      return await this.mcpToolsService.callTool(toolName, args);
    } catch (error: any) {
      console.error(
        `Error calling MCP tool '${toolName}' directly:`,
        error.message,
      );
      return `Error: Failed to execute tool '${toolName}'.`;
    }
  }

  private createToolFromDefinition(
    toolDef: TopcoderMcpToolDefinition,
  ): DynamicStructuredTool {
    return new (DynamicStructuredTool as unknown as {
      new <T = any>(opts: any): DynamicStructuredTool;
    })({
      name: toolDef.name,
      description: toolDef.description,
      schema: toolDef.inputSchema,
      func: async (input: any) => {
        try {
          const result = await this.callTool(toolDef.name, input);
          return JSON.stringify(result);
        } catch (error: any) {
          return `Error executing tool '${toolDef.name}': ${error.message}`;
        }
      },
    }) as DynamicStructuredTool;
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
