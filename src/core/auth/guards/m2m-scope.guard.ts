import { Request } from 'express';
import { decode } from './guards.utils';
import { JwtPayload } from 'jsonwebtoken';
import { M2mScope } from '../auth.constants';

export const checkM2MScope =
  (...requiredM2mScopes: M2mScope[]) =>
  async (req: Request) => {
    const decodedAuth = await decode(req.headers.authorization ?? '');

    const authorizedScopes = ((decodedAuth as JwtPayload).scope ?? '').split(
      ' ',
    );
    if (!requiredM2mScopes.some((scope) => authorizedScopes.includes(scope))) {
      return false;
    }

    return true;
  };
