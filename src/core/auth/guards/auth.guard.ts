import { Request } from 'express';
import { decodeAuthToken } from './guards.utils';

/**
 * Auth guard function to validate the authorization token from the request headers.
 *
 * @param req - The incoming HTTP request object.
 * @returns A promise that resolves to `true` if the authorization token is valid, otherwise `false`.
 */
export const authGuard = async (req: Request) => {
  if (!(await decodeAuthToken(req.headers.authorization ?? ''))) {
    return false;
  }

  return true;
};
