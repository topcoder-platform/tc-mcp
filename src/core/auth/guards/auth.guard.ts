import { Request } from 'express';
import { decode } from './guards.utils';

export const authGuard = async (req: Request) => {
  if (!(await decode(req.headers.authorization ?? ''))) {
    return false;
  }

  return true;
};
