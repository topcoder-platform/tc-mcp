import { Injectable, Inject } from '@nestjs/common';
import { Tool } from '@tc/mcp-nest';
import { REQUEST } from '@nestjs/core';
import { Logger } from 'src/shared/global';
import { FUZZY_MATCH_SKILLS_TOOL_PARAMETERS } from './fuzzymatchSkills.parameters';
import { FUZZY_MATCH_SKILLS_TOOL_OUTPUT_SCHEMA } from './fuzzymatchSkills.output';
import { TopcoderSkillsService } from 'src/shared/topcoder/skills.service';
import { LogTime } from 'src/shared/global/logTime.decorator';

@Injectable()
export class FuzzyMatchSkillsTool {
  private readonly logger = new Logger(FuzzyMatchSkillsTool.name);

  constructor(
    private readonly topcoderSkillsService: TopcoderSkillsService,
    @Inject(REQUEST) private readonly request: any,
  ) {}

  private async _fuzzyMatchSkills(params) {
    const validatedParams =
      FUZZY_MATCH_SKILLS_TOOL_PARAMETERS.safeParse(params);
    if (!validatedParams.success) {
      this.logger.error(
        `Invalid parameters provided: ${JSON.stringify(validatedParams.error.errors)}`,
      );

      return {
        content: [
          {
            type: 'text',
            text: `Invalid parameters: ${JSON.stringify(validatedParams.error.errors)}`,
          },
        ],
        isError: true,
      };
    }

    try {
      const accessToken = this.request.headers['authorization']?.split(' ')[1];
      const skills = await this.topcoderSkillsService.fetchFuzzySkills(
        validatedParams.data,
        accessToken,
      );

      if (skills.status < 200 || skills.status >= 300) {
        this.logger.error(
          `Failed to fetch fuzzy matched skills from Topcoder API: ${skills.statusText}`,
        );
        try {
          this.logger.error(skills.data);
        } catch (e) {
          this.logger.error('Failed to log fuzzy skills error', e);
        }

        return {
          content: [
            {
              type: 'text',
              text: `Error fetching fuzzy matched skills: ${skills.statusText}`,
            },
          ],
          isError: true,
        };
      }

      const skillsData = skills.data;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(skillsData),
          },
        ],
        structuredContent: skillsData,
      };
    } catch (error) {
      this.logger.error(
        `Error fetching fuzzy matched skills: ${error.message}`,
        error,
      );
      return {
        content: [
          {
            type: 'text',
            text: `Error fetching fuzzy matched skills: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  @Tool({
    name: 'fuzzy-match-tc-skills',
    description:
      'Returns skills that loosely match the provided term using Topcoder standardized skills fuzzy match endpoint.',
    parameters: FUZZY_MATCH_SKILLS_TOOL_PARAMETERS,
    outputSchema: FUZZY_MATCH_SKILLS_TOOL_OUTPUT_SCHEMA,
    annotations: {
      title: 'Fuzzy Match Topcoder Standardized Skills',
      readOnlyHint: true,
    },
  })
  @LogTime('FuzzyMatchSkillsTool')
  async fuzzyMatchSkills(params) {
    return this._fuzzyMatchSkills(params);
  }
}
