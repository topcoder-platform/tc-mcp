import { Request } from 'express';
import { decode } from './guards.utils';
import { Role } from '../auth.constants';

export const checkHasUserRole =
  (...requiredUserRoles: Role[]) =>
  async (req: Request) => {
    const decodedAuth = await decode(req.headers.authorization ?? '');

    const decodedUserRoles = Object.keys(decodedAuth).reduce((roles, key) => {
      if (key.match(/claims\/roles$/gi)) {
        return decodedAuth[key] as string[];
      }

      return roles;
    }, []);

    if (!requiredUserRoles.some((role) => decodedUserRoles.includes(role))) {
      return false;
    }

    return true;
  };
