import { Module } from '@nestjs/common';
import { TopcoderChallengesService } from './challenges.service';

@Module({
  providers: [TopcoderChallengesService],
  exports: [TopcoderChallengesService],
})
export class TopcoderModule {}
