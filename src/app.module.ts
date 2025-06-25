import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { McpModule } from '@rekog/mcp-nest';
import { QueryChallengesTool } from './mcp/tools/challenges/queryChallenges.tool';
import { randomUUID } from 'crypto';
import { GlobalProvidersModule } from './shared/global/globalProviders.module';
import { TopcoderModule } from './shared/topcoder/topcoder.module';
import { HealthCheckController } from './api/health-check/healthCheck.controller';
import { TokenValidatorMiddleware } from './core/auth/middleware/tokenValidator.middleware';
import { CreateRequestStoreMiddleware } from './core/request/createRequestStore.middleware';
import { AuthGuard, RolesGuard } from './core/auth/guards';
import { APP_GUARD } from '@nestjs/core';

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
      guards: [AuthGuard, RolesGuard],
    }),
    GlobalProvidersModule,
    TopcoderModule,
  ],
  controllers: [HealthCheckController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    QueryChallengesTool,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TokenValidatorMiddleware).forRoutes('*');
    consumer.apply(CreateRequestStoreMiddleware).forRoutes('*');
  }
}
