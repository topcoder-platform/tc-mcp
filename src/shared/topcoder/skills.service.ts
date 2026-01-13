import { Injectable } from '@nestjs/common';
import { ENV_CONFIG } from 'src/config';
import { Logger } from 'src/shared/global';
import { z } from 'zod';
import axios from 'axios';
import { QUERY_SKILLS_TOOL_PARAMETERS } from 'src/mcp/tools/skills/querySkills.parameters';
import { FUZZY_MATCH_SKILLS_TOOL_PARAMETERS } from 'src/mcp/tools/skills/fuzzymatchSkills.parameters';

const { TOPCODER_API_BASE_URL } = ENV_CONFIG;

@Injectable()
export class TopcoderSkillsService {
  private readonly logger = new Logger(TopcoderSkillsService.name);

  constructor() {}

  async fetchSkills(
    queryParams: z.infer<typeof QUERY_SKILLS_TOOL_PARAMETERS>,
    accessToken?: string,
  ) {
    // Format the input parameters
    const url = new URL(
      `${TOPCODER_API_BASE_URL}/v5/standardized-skills/skills`,
    );
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
    this.logger.log(`Fetching standardized skills from: "${stringUrl}"`);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    this.logger.log(
      `Fetching standardized skills with headers: "${JSON.stringify(headers)}"`,
    );

    try {
      const response = await axios.get(stringUrl, { headers });
      return response;
    } catch (error) {
      this.logger.error(
        `Error fetching skills: ${JSON.stringify(
          error?.response?.data ?? error?.message ?? error,
        )}`,
        error,
      );
      throw error;
    }
  }

  async fetchFuzzySkills(
    queryParams: z.infer<typeof FUZZY_MATCH_SKILLS_TOOL_PARAMETERS>,
    accessToken?: string,
  ) {
    const url = new URL(
      `${TOPCODER_API_BASE_URL}/v5/standardized-skills/skills/fuzzymatch`,
    );
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value.toString());
      }
    });

    const stringUrl = url.toString();
    this.logger.log(`Fetching fuzzy matched skills from: "${stringUrl}"`);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    this.logger.log(
      `Fetching fuzzy matched skills with headers: "${JSON.stringify(headers)}"`,
    );

    try {
      const response = await axios.get(stringUrl, { headers });
      return response;
    } catch (error) {
      this.logger.error(
        `Error fetching fuzzy matched skills: ${JSON.stringify(
          error?.response?.data ?? error?.message ?? error,
        )}`,
        error,
      );
      throw error;
    }
  }
}
