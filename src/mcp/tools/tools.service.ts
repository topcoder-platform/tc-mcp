import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { QueryChallengesTool } from './challenges/queryChallenges.tool';
import { QuerySkillsTool } from './skills/querySkills.tool';

@Injectable()
export class ToolsService {

  constructor(
    // Inject all of your individual tool providers here
    private readonly queryChallengesTool: QueryChallengesTool,
    private readonly querySkillsTool: QuerySkillsTool,
  ) {}

  async callTool(
    toolName: string,
    args: Record<string, any>,
  ): Promise<any> {
    // Use a switch statement to call the correct method on the correct tool service
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