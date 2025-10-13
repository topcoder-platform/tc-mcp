import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { McpModule } from '@tc/mcp-nest';
import { HealthCheckController } from './api/health-check/healthCheck.controller';
import { TokenValidatorMiddleware } from './core/auth/middleware/tokenValidator.middleware';
import { ToolsModule } from './mcp/tools/tools.module';
import { GlobalProvidersModule } from './shared/global/globalProviders.module';
import { ResourcesModule } from './mcp/resources/resources.module';
import { randomUUID } from 'crypto';

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
    ToolsModule,
    ResourcesModule,
  ],
  controllers: [HealthCheckController],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TokenValidatorMiddleware).forRoutes('*');
  }
}
