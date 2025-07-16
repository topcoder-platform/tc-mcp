import { Module } from '@nestjs/common';
import { QueryChallengesTool } from './challenges/queryChallenges.tool';
import { TopcoderModule } from 'src/shared/topcoder/topcoder.module';

@Module({
  imports: [TopcoderModule],
  controllers: [],
  providers: [QueryChallengesTool],
})
export class ToolsModule {}
