import { Request } from 'express';
import { decodeAuthToken } from './guards.utils';
import { Role } from '../auth.constants';

/**
 * A utility function to check if the required user role are present
 * in the authorization token provided in the request headers.
 *
 * @param {...Role[]} requiredUserRoles - The list of required user roles to validate against.
 * @returns {Promise<(req: Request) => boolean>} A function that takes an Express `Request` object
 * and returns a boolean indicating whether the required scopes are present.
 *
 * The function decodes the authorization token from the request headers and checks if
 * the required user roles are included in the token's scope claim.
 */
export const checkHasUserRole =
  (...requiredUserRoles: Role[]) =>
  async (req: Request) => {
    const decodedAuth = await decodeAuthToken(req.headers.authorization ?? '');

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
