import { Module } from '@nestjs/common';
import { QueryChallengesTool } from './challenges/queryChallenges.tool';
import { TopcoderModule } from 'src/shared/topcoder/topcoder.module';
import { QuerySkillsTool } from './skills/querySkills.tool';
import { FuzzyMatchSkillsTool } from './skills/fuzzymatchSkills.tool';

@Module({
  imports: [TopcoderModule],
  controllers: [],
  providers: [QueryChallengesTool, QuerySkillsTool, FuzzyMatchSkillsTool],
})
export class ToolsModule {}
