import { Module } from '@nestjs/common';
import { ChallengesApiSwaggerResource } from './swagger/challenges.resource';
import { MemberApiSwaggerResource } from './swagger/member.resource';
import { IdentityApiSwaggerResource } from './swagger/identity.resource';
import { ReviewApiSwaggerResource } from './swagger/review.resource';

@Module({
  imports: [],
  controllers: [],
  providers: [
    ChallengesApiSwaggerResource,
    MemberApiSwaggerResource,
    IdentityApiSwaggerResource,
    ReviewApiSwaggerResource,
  ],
})
export class ResourcesModule {}
