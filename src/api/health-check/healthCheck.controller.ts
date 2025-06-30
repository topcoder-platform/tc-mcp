import { Controller, Get, Version, VERSION_NEUTRAL } from '@nestjs/common';
import { Public } from 'src/core/auth/decorators';
import { Logger } from 'src/shared/global';

export enum HealthCheckStatus {
  healthy = 'healthy',
  unhealthy = 'unhealthy',
}

export class GetHealthCheckResponseDto {
  status: HealthCheckStatus;
}

@Controller()
export class HealthCheckController {
  private readonly logger = new Logger(HealthCheckController.name);

  constructor() {}

  @Public()
  @Version([VERSION_NEUTRAL, '1'])
  @Get('/health')
  healthCheck(): Promise<GetHealthCheckResponseDto> {
    const response = new GetHealthCheckResponseDto();

    response.status = HealthCheckStatus.healthy;

    return Promise.resolve(response);
  }
}
