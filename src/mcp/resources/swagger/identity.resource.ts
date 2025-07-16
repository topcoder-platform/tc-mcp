import { Injectable } from '@nestjs/common';
import { Resource } from '@tc/mcp-nest';
import axios from 'axios';
import { Logger } from 'src/shared/global';

const SPEC_URL =
  'https://raw.githubusercontent.com/topcoder-platform/identity-api-v6/refs/heads/develop/doc/swagger.yaml';

@Injectable()
export class IdentityApiSwaggerResource {
  private readonly logger = new Logger(IdentityApiSwaggerResource.name);

  @Resource({
    uri: SPEC_URL,
    name: 'Identity V6 API Swagger',
    description: 'Swagger documentation for the Identity V6 API',
    mimeType: 'text/yaml',
  })
  async getIdentityApiSwagger() {
    this.logger.debug('Fetching Identity V6 API Swagger');
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
