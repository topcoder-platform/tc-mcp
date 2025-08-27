import { Injectable } from '@nestjs/common';
import { Resource } from '@tc/mcp-nest';
import axios from 'axios';
import { Logger } from 'src/shared/global';
import { LogTime } from 'src/shared/global/logTime.decorator';

const SPEC_URL =
  'https://raw.githubusercontent.com/topcoder-platform/challenge-api-v6/refs/heads/develop/docs/swagger.yaml';

@Injectable()
export class ChallengesApiSwaggerResource {
  private readonly logger = new Logger(ChallengesApiSwaggerResource.name);

  @Resource({
    uri: SPEC_URL,
    name: 'Challenges V6 API Swagger',
    description: 'Swagger documentation for the Challenges V6 API',
    mimeType: 'text/yaml',
  })
  @LogTime('ChallengesApiSwaggerResource')
  async getChallengesApiSwagger() {
    this.logger.debug('Fetching Challenges V6 API Swagger');
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
