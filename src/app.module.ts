import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { McpModule } from '@tc/mcp-nest';
import { HealthCheckController } from './api/health-check/healthCheck.controller';
import { TokenValidatorMiddleware } from './core/auth/middleware/tokenValidator.middleware';
import { ToolsModule } from './mcp/tools/tools.module';
import { GlobalProvidersModule } from './shared/global/globalProviders.module';
import { ResourcesModule } from './mcp/resources/resources.module';
import { randomUUID } from 'crypto';
import { AgentModule } from './agent/agent.module';
import { MongooseModule, MongooseModuleOptions } from '@nestjs/mongoose';
import { ENV_CONFIG } from './config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import * as fs from 'fs';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'teamsTab', 'dist'), // Vite build output
      exclude: [`${ENV_CONFIG.API_BASE}*`], // Nest NOT to serve static files for backend URLs
      serveRoot: '/teamsTab', // base URL for frontend configured in vite config
      serveStaticOptions: {
        fallthrough: false, // ensures Nest stops if file not found
      },
    }),
    MongooseModule.forRootAsync({
      useFactory: (): MongooseModuleOptions => {
        const opts: MongooseModuleOptions = {
          uri: ENV_CONFIG.MONGO_DB_URL,
          retryWrites: false,

          // TLS
          tls: !!ENV_CONFIG.MONGO_TLS_CA_PATH,
          tlsCAFile: ENV_CONFIG.MONGO_TLS_CA_PATH,

          // REQUIRED for DocumentDB over SSH tunnel
          directConnection: ENV_CONFIG.MONGO_IN_SSH_TUNNEL,
          tlsAllowInvalidHostnames: ENV_CONFIG.MONGO_IN_SSH_TUNNEL,

          // Auth Mechanism for DocumentDB Compatibility
          authMechanism: 'SCRAM-SHA-1',
        };

        if (
          ENV_CONFIG.MONGO_TLS_CA_PATH &&
          !fs.existsSync(ENV_CONFIG.MONGO_TLS_CA_PATH)
        ) {
          throw new Error(
            `Mongo CA file not found at ${ENV_CONFIG.MONGO_TLS_CA_PATH}`,
          );
        }

        return opts;
      },
    }),
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
