import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { McpModule } from '@tc/mcp-nest';
import { HealthCheckController } from './api/health-check/healthCheck.controller';
import { TokenValidatorMiddleware } from './core/auth/middleware/tokenValidator.middleware';
import { nanoid } from 'nanoid';
import { ToolsModule } from './mcp/tools/tools.module';
import { GlobalProvidersModule } from './shared/global/globalProviders.module';
import { ResourcesModule } from './mcp/resources/resources.module';

@Module({
  imports: [
    McpModule.forRoot({
      name: 'topcoder-mcp-server',
      version: '1.0.0',
      streamableHttp: {
        enableJsonResponse: false,
        sessionIdGenerator: () => nanoid(),
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
