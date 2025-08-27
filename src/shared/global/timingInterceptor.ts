import { Injectable, NestMiddleware, Logger } from '@nestjs/common';

import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TimingInterceptorMiddleware implements NestMiddleware {
  private logger = new Logger('TimingInterceptor');

  use(request: Request, response: Response, next: NextFunction): void {
    const { method, originalUrl: url } = request;
    const start = Date.now();
    const mcpMethod = request.body?.method;
    const mcpToolName = request.body?.params?.name

    response.on('close', () => {
      const { statusCode } = response;
      const duration = Date.now() - start;

      this.logger.log(
        `${method} ${mcpMethod ? `{${mcpMethod}}${mcpToolName ? `(${mcpToolName}) ` : ''}` : ''}${url} ${statusCode} took ${duration}ms`
      );
    });

    next();
  }
}