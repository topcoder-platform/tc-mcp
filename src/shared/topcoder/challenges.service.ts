import { Injectable } from '@nestjs/common';
import { ENV_CONFIG } from 'src/config';
import { Logger } from 'src/shared/global';
import { QUERY_CHALLENGES_TOOL_PARAMETERS } from 'src/mcp/tools/challenges/queryChallenges.parameters';
import { z } from 'zod';
import axios from 'axios';

const { TOPCODER_API_BASE_URL } = ENV_CONFIG;

@Injectable()
export class TopcoderChallengesService {
  private readonly logger = new Logger(TopcoderChallengesService.name);

  constructor() {}

  async fetchChallenges(
    queryParams: z.infer<typeof QUERY_CHALLENGES_TOOL_PARAMETERS>,
    accessToken?: string,
  ) {
    // Format the input parameters
    const url = new URL(`${TOPCODER_API_BASE_URL}/challenges`);
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((v) => url.searchParams.append(key, v));
        } else {
          url.searchParams.append(key, value.toString());
        }
      }
    });

    const stringUrl = url.toString();
    this.logger.log(`Fetching challenges from: "${stringUrl}"`);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'app-version': '2.0.0',
    };
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    this.logger.log(
      `Fetching challenges with headers: "${JSON.stringify(headers)}"`,
    );

    try {
      const response = await axios.get(stringUrl, { headers });
      return response;
    } catch (error) {
      this.logger.error(
        `Error fetching challenges: ${JSON.stringify(error)}`,
        error,
      );
      throw error;
    }
  }
}
