// greeting.tool.ts
import { Injectable, Inject } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
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

  @Tool({
    name: 'query-tc-challenges',
    description:
      'Returns a list of public Topcoder challenges based on the query parameters.',
    parameters: QUERY_CHALLENGES_TOOL_PARAMETERS,
    outputSchema: QUERY_CHALLENGES_TOOL_OUTPUT_SCHEMA,
    annotations: {
      title: 'Query Public Topcoder Challenges',
      readOnlyHint: true,
    },
  })
  async queryChallenges(params) {
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

      if (!challenges.ok) {
        this.logger.error(
          `Failed to fetch challenges from Topcoder API: ${challenges.statusText}`,
        );

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

      // Parse the response as JSON
      const challengesData = await challenges.json();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              page: Number(challenges.headers.get('x-page')) || 1,
              pageSize:
                Number(challenges.headers.get('x-per-page')) ||
                challengesData.length ||
                0,
              total:
                Number(challenges.headers.get('x-total')) ||
                challengesData.length ||
                0,
              nextPage: challenges.headers.get('x-next-page')
                ? Number(challenges.headers.get('x-next-page'))
                : null,
              data: challengesData,
            }),
          },
        ],
        structuredContent: {
          page: Number(challenges.headers.get('x-page')) || 1,
          pageSize:
            Number(challenges.headers.get('x-per-page')) ||
            challengesData.length ||
            0,
          total:
            Number(challenges.headers.get('x-total')) ||
            challengesData.length ||
            0,
          nextPage: challenges.headers.get('x-next-page')
            ? Number(challenges.headers.get('x-next-page'))
            : null,
          data: challengesData,
        },
      };
    } catch (error) {
      this.logger.error(`Error fetching challenges: ${error.message}`);
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
}
