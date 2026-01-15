import { Transform } from 'class-transformer';

export function ToBoolean() {
  return Transform(({ value }) => {
    if (value === undefined) return undefined;

    if (typeof value === 'boolean') return value;

    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }

    return undefined;
  });
}
