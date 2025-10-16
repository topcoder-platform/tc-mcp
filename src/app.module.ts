import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { McpModule } from '@tc/mcp-nest';
import { HealthCheckController } from './api/health-check/healthCheck.controller';
import { TokenValidatorMiddleware } from './core/auth/middleware/tokenValidator.middleware';
import { ToolsModule } from './mcp/tools/tools.module';
import { GlobalProvidersModule } from './shared/global/globalProviders.module';
import { ResourcesModule } from './mcp/resources/resources.module';
import { randomUUID } from 'crypto';
import { AgentModule } from './agent/agent.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ENV_CONFIG } from './config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'teamsTab', 'dist'), // Vite build output
      exclude: [`${ENV_CONFIG.API_BASE}*`], // Nest NOT to serve static files for backend URLs
      serveRoot: '/teamsTab', // base URL for frontend configured in vite config
      serveStaticOptions: {
        fallthrough: false, // ensures Nest stops if file not found
      },
    }),
    MongooseModule.forRoot(ENV_CONFIG.MONGO_DB_URL),
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
    AgentModule,
  ],
  controllers: [HealthCheckController],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TokenValidatorMiddleware)
      .exclude({ path: 'agent/*path', method: RequestMethod.ALL })
      .forRoutes('*');
  }
}
