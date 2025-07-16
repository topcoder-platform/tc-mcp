import { Injectable } from '@nestjs/common';
import { Resource } from '@tc/mcp-nest';
import axios from 'axios';
import { Logger } from 'src/shared/global';

const SPEC_URL =
  'https://raw.githubusercontent.com/topcoder-platform/member-api-v6/refs/heads/develop/docs/swagger.yaml';

@Injectable()
export class MemberApiSwaggerResource {
  private readonly logger = new Logger(MemberApiSwaggerResource.name);

  @Resource({
    uri: SPEC_URL,
    name: 'Member V6 API Swagger',
    description: 'Swagger documentation for the Member V6 API',
    mimeType: 'text/yaml',
  })
  async getMemberApiSwagger() {
    this.logger.debug('Fetching Member V6 API Swagger');
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
