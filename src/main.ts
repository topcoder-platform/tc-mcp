import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'src/shared/global';
import { ENV_CONFIG } from './config';
import { EventEmitter2 } from '@nestjs/event-emitter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const logger = new Logger('bootstrap()');

  // Enable CORS to allow requests from the frontend development server
  app.enableCors();

  // Global prefix for all routes
  app.setGlobalPrefix(ENV_CONFIG.API_BASE);

  // Add an event handler to log uncaught promise rejections and prevent the server from crashing
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  // Add an event handler to log uncaught errors and prevent the server from crashing
  process.on('uncaughtException', (error: Error) => {
    logger.error(
      `Unhandled Error at: ${error}\n` + `Exception origin: ${error.stack}`,
    );
  });

  await app.listen(ENV_CONFIG.PORT ?? 3000);

  const eventEmitter = app.get(EventEmitter2);
  eventEmitter.emit('server.ready');
}

void bootstrap();
