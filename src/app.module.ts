import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { McpModule } from '@rekog/mcp-nest';
import { QueryChallengesTool } from './mcp/tools/challenges/queryChallenges.tool';
import { randomUUID } from 'crypto';
import { GlobalProvidersModule } from './shared/global/globalProviders.module';
import { TopcoderModule } from './shared/topcoder/topcoder.module';
import { HealthCheckController } from './api/health-check/healthCheck.controller';
import { TokenValidatorMiddleware } from './core/auth/middleware/tokenValidator.middleware';

@Module({
  imports: [
    McpModule.forRoot({
      name: 'topcoder-mcp-server',
      version: '1.0.0',
      streamableHttp: {
        enableJsonResponse: false,
        sessionIdGenerator: () => randomUUID(),
        statelessMode: false,
      },
    }),
    GlobalProvidersModule,
    TopcoderModule,
  ],
  controllers: [HealthCheckController],
  providers: [QueryChallengesTool],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TokenValidatorMiddleware).forRoutes('*');
  }
}
