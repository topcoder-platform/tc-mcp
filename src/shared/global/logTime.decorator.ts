import { Logger } from '@nestjs/common';

export function LogTime(label?: string) {
  const logger = new Logger('ExecutionTime');

  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const start = Date.now();

      try {
        const result = await originalMethod.apply(this, args);
        const ms = Date.now() - start;
        logger.log(`${label || propertyKey} executed in ${ms}ms`);
        return result;
      } catch (error) {
        const ms = Date.now() - start;
        logger.error(
          `${label || propertyKey} failed after ${ms}ms – ${error.message}`,
        );
        throw error;
      }
    };

    return descriptor;
  };
}
