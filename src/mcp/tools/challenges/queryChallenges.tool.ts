import { Injectable, Inject } from '@nestjs/common';
import { Tool } from '@tc/mcp-nest';
import { REQUEST } from '@nestjs/core';
import { QUERY_CHALLENGES_TOOL_PARAMETERS } from './queryChallenges.parameters';
import { TopcoderChallengesService } from 'src/shared/topcoder/challenges.service';
import { Logger } from 'src/shared/global';
import { QUERY_CHALLENGES_TOOL_OUTPUT_SCHEMA } from './queryChallenges.output';

@Injectable()
export class QueryChallengesTool {
  private readonly logger = new Logger(QueryChallengesTool.name);

  constructor(
    private readonly topcoderChallengesService: TopcoderChallengesService,
    @Inject(REQUEST) private readonly request: any,
  ) {}

  private async _queryChallenges(params) {
    // Validate the input parameters
    const validatedParams = QUERY_CHALLENGES_TOOL_PARAMETERS.safeParse(params);
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
      const challenges = await this.topcoderChallengesService.fetchChallenges(
        validatedParams.data,
        accessToken,
      );

      if (challenges.status < 200 || challenges.status >= 300) {
        this.logger.error(
          `Failed to fetch challenges from Topcoder API: ${challenges.statusText}`,
        );
        try {
          this.logger.error(challenges.data);
        } catch (e) {
          this.logger.error('Failed to log challenge error', e);
        }

        // Return an error response if the API call fails
        return {
          content: [
            {
              type: 'text',
              text: `Error fetching challenges: ${challenges.statusText}`,
            },
          ],
          isError: true,
        };
      }

      // Axios response: data is already parsed, headers are plain object
      const challengesData = challenges.data;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              page: Number(challenges.headers['x-page']) || 1,
              pageSize:
                Number(challenges.headers['x-per-page']) ||
                (Array.isArray(challengesData) ? challengesData.length : 0) ||
                0,
              total:
                Number(challenges.headers['x-total']) ||
                (Array.isArray(challengesData) ? challengesData.length : 0) ||
                0,
              nextPage: challenges.headers['x-next-page']
                ? Number(challenges.headers['x-next-page'])
                : null,
              data: challengesData,
            }),
          },
        ],
        structuredContent: {
          page: Number(challenges.headers['x-page']) || 1,
          pageSize:
            Number(challenges.headers['x-per-page']) ||
            (Array.isArray(challengesData) ? challengesData.length : 0) ||
            0,
          total:
            Number(challenges.headers['x-total']) ||
            (Array.isArray(challengesData) ? challengesData.length : 0) ||
            0,
          nextPage: challenges.headers['x-next-page']
            ? Number(challenges.headers['x-next-page'])
            : null,
          data: challengesData,
        },
      };
    } catch (error) {
      this.logger.error(`Error fetching challenges: ${error.message}`, error);
      return {
        content: [
          {
            type: 'text',
            text: `Error fetching challenges: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  @Tool({
    name: 'query-tc-challenges',
    description:
      'Returns a list of Topcoder challenges based on the query parameters.',
    parameters: QUERY_CHALLENGES_TOOL_PARAMETERS,
    outputSchema: QUERY_CHALLENGES_TOOL_OUTPUT_SCHEMA,
    annotations: {
      title: 'Query Topcoder Challenges',
      readOnlyHint: true,
    },
  })
  async queryChallenges(params) {
    return this._queryChallenges(params);
  }
}
