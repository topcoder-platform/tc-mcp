import { Injectable, Inject } from '@nestjs/common';
import { Tool } from '@tc/mcp-nest';
import { REQUEST } from '@nestjs/core';
import { Logger } from 'src/shared/global';
import { QUERY_SKILLS_TOOL_PARAMETERS } from './querySkills.parameters';
import { QUERY_SKILLS_TOOL_OUTPUT_SCHEMA } from './querySkills.output';
import { TopcoderSkillsService } from 'src/shared/topcoder/skills.service';
import { LogTime } from 'src/shared/global/logTime.decorator';

@Injectable()
export class QuerySkillsTool {
  private readonly logger = new Logger(QuerySkillsTool.name);

  constructor(
    private readonly topcoderSkillsService: TopcoderSkillsService,
    @Inject(REQUEST) private readonly request: any,
  ) {}

  private async _querySkills(params) {
    // Validate the input parameters
    const validatedParams = QUERY_SKILLS_TOOL_PARAMETERS.safeParse(params);
    if (!validatedParams.success) {
      this.logger.error(
        `Invalid parameters provided: ${JSON.stringify(validatedParams.error.errors)}`,
      );

      // Return an error response with the validation errors
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

    // Get the challenges from the Topcoder challenges API
    // and handle any errors that may occur
    try {
      const accessToken = this.request.headers['authorization']?.split(' ')[1];
      const skills = await this.topcoderSkillsService.fetchSkills(
        validatedParams.data,
        accessToken,
      );

      if (skills.status < 200 || skills.status >= 300) {
        this.logger.error(
          `Failed to fetch skills from Topcoder API: ${skills.statusText}`,
        );
        try {
          this.logger.error(skills.data);
        } catch (e) {
          this.logger.error('Failed to log skills error', e);
        }

        // Return an error response if the API call fails
        return {
          content: [
            {
              type: 'text',
              text: `Error fetching skills: ${skills.statusText}`,
            },
          ],
          isError: true,
        };
      }

      // Axios response: data is already parsed, headers are plain object
      const skillsData = skills.data;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              page: Number(skills.headers['x-page']) || 1,
              pageSize:
                Number(skills.headers['x-per-page']) ||
                (Array.isArray(skillsData) ? skillsData.length : 0) ||
                0,
              total:
                Number(skills.headers['x-total']) ||
                (Array.isArray(skillsData) ? skillsData.length : 0) ||
                0,
              data: skillsData,
            }),
          },
        ],
        structuredContent: {
          page: Number(skills.headers['x-page']) || 1,
          pageSize:
            Number(skills.headers['x-per-page']) ||
            (Array.isArray(skillsData) ? skillsData.length : 0) ||
            0,
          total:
            Number(skills.headers['x-total']) ||
            (Array.isArray(skillsData) ? skillsData.length : 0) ||
            0,
          data: skillsData,
        },
      };
    } catch (error) {
      this.logger.error(`Error fetching skills: ${error.message}`, error);
      return {
        content: [
          {
            type: 'text',
            text: `Error fetching skills: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  @Tool({
    name: 'query-tc-skills',
    description:
      'Returns a list of standardized skills from Topcoder platform, filtered and sorted based on the provided parameters.',
    parameters: QUERY_SKILLS_TOOL_PARAMETERS,
    outputSchema: QUERY_SKILLS_TOOL_OUTPUT_SCHEMA,
    annotations: {
      title: 'Query Topcoder Standardized Skills',
      readOnlyHint: true,
    },
  })
  @LogTime('SkillsTool')
  async querySkills(params) {
    return this._querySkills(params);
  }
}
