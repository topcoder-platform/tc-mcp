import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { QueryChallengesTool } from './challenges/queryChallenges.tool';
import { QuerySkillsTool } from './skills/querySkills.tool';
import { Reflector } from '@nestjs/core';
import { MCP_TOOL_METADATA_KEY } from '@tc/mcp-nest';

@Injectable()
export class ToolsService {
  constructor(
    private readonly reflector: Reflector,
    private readonly queryChallengesTool: QueryChallengesTool,
    private readonly querySkillsTool: QuerySkillsTool,
  ) {}

  /**
   * Reads the original metadata from the @Tool decorators to build the list of tools.
   * Returns the compiled Zod schema directly.
   */
  listTools(): any[] {
    const toolImplementations = [
      { instance: this.queryChallengesTool, methodName: 'queryChallenges' },
      { instance: this.querySkillsTool, methodName: 'querySkills' },
    ];

    return toolImplementations
      .map(({ instance, methodName }) => {
        const method = instance[methodName];
        const toolMetadata: any = this.reflector.get<any>(
          MCP_TOOL_METADATA_KEY,
          method,
        );

        if (!toolMetadata) return null;

        // Return the full metadata object, which includes the Zod schema
        return {
          name: toolMetadata.name,
          description: toolMetadata.description,
          inputSchema: toolMetadata.parameters,
        };
      })
      .filter(Boolean);
  }

  async callTool(toolName: string, args: Record<string, any>): Promise<any> {
    switch (toolName) {
      case 'query-tc-challenges':
        return this.queryChallengesTool.queryChallenges(args);
      case 'query-tc-skills':
        return this.querySkillsTool.querySkills(args);
      default:
        throw new InternalServerErrorException(`Tool '${toolName}' not found.`);
    }
  }
}
