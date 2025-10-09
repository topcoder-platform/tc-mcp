import { DynamicStructuredTool } from "@langchain/core/tools";
// import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import axios, { AxiosInstance } from "axios";
// import axiosRetry from "axios-retry";
import { jsonSchemaToZod } from "./schemaConverter";
import { ENV_CONFIG } from "src/config";
import toolDefinitions from "./tc-tools.json";
import { ToolsService } from "src/mcp/tools/tools.service";
import { Injectable } from "@nestjs/common";

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
  private axiosInstance: AxiosInstance;
  private sessionToken: string;
  private mcpSessionId: string | null = "local";
  private tools: DynamicStructuredTool[] | null = null;

  constructor(private readonly mcpToolsService: ToolsService) {}

  /**
   * Initializes the session with the MCP Gateway and retrieves a temporary mcp-session-id.
   */
  private async initializeSession(): Promise<void> {
    console.log("Initializing MCP session...");
    const payload = {
      jsonrpc: "2.0",
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        clientInfo: { name: "teams-ai-agent-backend", version: "1.0.0" },
      },
      id: 1,
    };

    try {
      const response = await this.axiosInstance.post("", payload, {
        headers: {
          Accept: "application/json, text/event-stream",
          "Content-Type": "application/json",
          "X-MCP-Session": this.sessionToken,
        },
      });

      // The session ID is returned in the headers
      const sessionId = response.headers["mcp-session-id"];
      if (sessionId) {
        this.mcpSessionId = Array.isArray(sessionId) ? sessionId[0] : sessionId;
        console.log(`MCP Session Initialized. Session ID: ${this.mcpSessionId}`);
      } else {
        throw new Error("MCP Session ID was not returned in the response headers.");
      }
    } catch (error: any) {
      console.error("Failed to initialize MCP session:", error.response?.data || error.message);
      throw new Error("Could not initialize MCP session.");
    }
  }

  /**
   * Parses an SSE response string to extract the JSON data.
   */
  private parseSseResponse(sseText: string): any {
    const lines = sseText.trim().split("\n");
    for (const line of lines) {
      if (line.startsWith("data: ")) {
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

    const tools = toolDefinitions.map((toolDef) => this.createToolFromDefinition(toolDef));
    this.tools = tools;
    return tools;
  }

  /**
   * Calls a specific tool on the MCP Gateway.
   * @param toolName The name of the tool to call (e.g., 'query-tc-challenges').
   * @param args The arguments for the tool.
   */
  public async callTool(toolName: string, args: Record<string, any>): Promise<any> {
    // Lazy-initialize the session if it hasn't been done yet.
    if (!this.mcpSessionId) {
      await this.initializeSession();
    }

    console.log(`Calling MCP tool '${toolName}' with args:`, args);
    const payload = {
      jsonrpc: "2.0",
      method: "tools/call",
      params: {
        name: toolName,
        arguments: args,
      },
      id: Date.now(), // Use a unique ID for each call
    };

    try {
      const response = await this.axiosInstance.post("", payload, {
        headers: {
          Accept: "application/json, text/event-stream",
          "Content-Type": "application/json",
          "X-MCP-Session": this.sessionToken,
          "mcp-session-id": this.mcpSessionId,
        },
      });

      const parsedData = this.parseSseResponse(response.data);
      if (parsedData?.error) {
        throw new Error(`MCP returned an error: ${JSON.stringify(parsedData.error)}`);
      }

      return parsedData?.result?.content;
    } catch (error: any) {
      console.error(`Error calling MCP tool '${toolName}':`, error.response?.data || error.message);
      return `Error: Failed to execute tool '${toolName}'.`;
    }
  }

  public async callLocalTool(
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

  private createToolFromDefinition(toolDef: TopcoderMcpToolDefinition): DynamicStructuredTool {
    const schema = jsonSchemaToZod(toolDef.inputSchema) as any;
    // console.log(`--- Zod Schema for ${toolDef.name} ---`);
    // console.log(JSON.stringify(schema.shape, null, 2));

    return new (DynamicStructuredTool as unknown as { new <T = any>(opts: any): DynamicStructuredTool })({
      name: toolDef.name,
      description: toolDef.description,
      schema: schema,
      func: async (input: any) => {
        try {
          const result = await this.callLocalTool(toolDef.name, input);
          return JSON.stringify(result);
        } catch (error: any) {
          return `Error executing tool '${toolDef.name}': ${error.message}`;
        }
      },
    }) as DynamicStructuredTool;
  }

  /**
   * (Optional) Fetches the list of raw tool definitions from the MCP Gateway.
   * This is useful for administrative purposes or to update the local tools.json file.
   */
  public async listTools(): Promise<any[]> {
    if (!this.mcpSessionId) {
      await this.initializeSession();
    }
    console.log("Listing MCP tools...");
    const payload = {
      jsonrpc: "2.0",
      method: "tools/list",
      params: {},
      id: Date.now(),
    };
    try {
      const response = await this.axiosInstance.post("", payload, {
        headers: {
          Accept: "application/json, text/event-stream",
          "Content-Type": "application/json",
          "X-MCP-Session": this.sessionToken,
          "mcp-session-id": this.mcpSessionId,
        },
      });
      const parsedData = this.parseSseResponse(response.data);
      if (parsedData?.error) {
        throw new Error(`MCP returned an error: ${JSON.stringify(parsedData.error)}`);
      }
      const tools = parsedData?.result?.tools || [];
      console.log(`Found ${tools.length} tools from MCP Gateway.`);

      // writeFileSync(join(__dirname, "tc-tools.json"), JSON.stringify(tools));

      return tools;
    } catch (error: any) {
      console.error("Error listing MCP tools:", error.message);
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
      "id",
      "status",
      "type",
      "track",
      "tag",
      "tags",
      "search",
      "startDateStart",
      "startDateEnd",
      "currentPhaseName",
      "totalPrizesFrom",
      "totalPrizesTo",
      "createdBy",
    ]);

    const topLevelKeys = new Set(["page", "perPage", "sortBy", "sortOrder"]);

    // Start building the new, nested schema
    const newSchema: any = {
      type: "object",
      properties: {
        // Define the top-level properties first
        // We will populate them from the original schema
      },
    };

    const filterObject: any = {
      type: "object",
      description: "A comprehensive set of filters to apply to the query. Combine multiple filters to narrow down results.",
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
