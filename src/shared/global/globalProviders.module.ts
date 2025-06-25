import { Global, Module } from '@nestjs/common';

// Global module for providing global providers
// Add any provider you want to be global here
@Global()
@Module({
  providers: [],
  exports: [],
})
export class GlobalProvidersModule {}
