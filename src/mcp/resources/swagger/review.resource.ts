import { Injectable } from '@nestjs/common';
import { Resource } from '@tc/mcp-nest';
import axios from 'axios';
import { Logger } from 'src/shared/global';

const SPEC_URL = 'https://api.topcoder-dev.com/v6/review/api-docs-yaml';

@Injectable()
export class ReviewApiSwaggerResource {
  private readonly logger = new Logger(ReviewApiSwaggerResource.name);

  @Resource({
    uri: SPEC_URL,
    name: 'Review V6 API Swagger',
    description: 'Swagger documentation for the Review V6 API',
    mimeType: 'text/yaml',
  })
  async getReviewApiSwagger() {
    this.logger.debug('Fetching Review V6 API Swagger');
    // Fetch the content from the URI and return it.
    const rawContent = await axios.get(SPEC_URL);
    return {
      contents: [
        {
          uri: SPEC_URL,
          mimeType: 'text/yaml',
          text: rawContent.data,
        },
      ],
    };
  }
}
