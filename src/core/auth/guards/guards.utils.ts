import * as jwt from 'jsonwebtoken';
import { Logger } from 'src/shared/global';
import { getSigningKey } from '../jwt';

const logger = new Logger('guards.utils()');

/**
 * Decodes and verifies a JWT token from the provided authorization header.
 *
 * @param authHeader - The authorization header containing the token, expected in the format "Bearer <token>".
 * @returns A promise that resolves to the decoded JWT payload if the token is valid,
 *          a string if the payload is a string, or `false` if the token is invalid or the header is improperly formatted.
 *
 * @throws This function does not throw directly but will return `false` if an error occurs during verification.
 */
export const decodeAuthToken = async (
  authHeader: string,
): Promise<boolean | jwt.JwtPayload | string> => {
  const [type, idToken] = authHeader?.split(' ') ?? [];

  if (type !== 'Bearer' || !idToken) {
    return false;
  }

  let decoded: jwt.JwtPayload | string;
  try {
    const signingKey = await getSigningKey(idToken);
    decoded = jwt.verify(idToken, signingKey);
  } catch (error) {
    logger.error('Error verifying JWT', error);
    return false;
  }

  return decoded;
};
