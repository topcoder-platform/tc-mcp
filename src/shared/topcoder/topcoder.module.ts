import { Module } from '@nestjs/common';
import { TopcoderChallengesService } from './challenges.service';
import { TopcoderSkillsService } from './skills.service';

@Module({
  providers: [TopcoderChallengesService, TopcoderSkillsService],
  exports: [TopcoderChallengesService, TopcoderSkillsService],
})
export class TopcoderModule {}
