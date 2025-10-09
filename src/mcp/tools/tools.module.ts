import { Module } from '@nestjs/common';
import { QueryChallengesTool } from './challenges/queryChallenges.tool';
import { TopcoderModule } from 'src/shared/topcoder/topcoder.module';
import { QuerySkillsTool } from './skills/querySkills.tool';
import { ToolsService } from './tools.service';

@Module({
  imports: [TopcoderModule],
  controllers: [],
  providers: [QueryChallengesTool, QuerySkillsTool, ToolsService],
  exports: [QueryChallengesTool, QuerySkillsTool, ToolsService],
})
export class ToolsModule {}
