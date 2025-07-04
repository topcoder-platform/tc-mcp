import { Request } from 'express';
import { decodeAuthToken } from './guards.utils';
import { JwtPayload } from 'jsonwebtoken';
import { M2mScope } from '../auth.constants';

/**
 * A utility function to check if the required M2M (Machine-to-Machine) scopes are present
 * in the authorization token provided in the request headers.
 *
 * @param {...M2mScope[]} requiredM2mScopes - The list of required M2M scopes to validate against.
 * @returns {Promise<(req: Request) => boolean>} A function that takes an Express `Request` object
 * and returns a boolean indicating whether the required scopes are present.
 *
 * The function decodes the authorization token from the request headers and checks if
 * the required scopes are included in the token's scope claim.
 */
export const checkM2MScope =
  (...requiredM2mScopes: M2mScope[]) =>
  async (req: Request) => {
    const decodedAuth = await decodeAuthToken(req.headers.authorization ?? '');

    const authorizedScopes = ((decodedAuth as JwtPayload).scope ?? '').split(
      ' ',
    );
    if (!requiredM2mScopes.some((scope) => authorizedScopes.includes(scope))) {
      return false;
    }

    return true;
  };
