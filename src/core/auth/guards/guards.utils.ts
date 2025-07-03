import * as jwt from 'jsonwebtoken';
// import { UnauthorizedException } from '@nestjs/common';
import { Logger } from 'src/shared/global';
import { getSigningKey } from '../jwt';

const logger = new Logger('guards.utils()');

export const decode = async (authHeader: string) => {
  const [type, idToken] = authHeader?.split(' ') ?? [];

  if (type !== 'Bearer' || !idToken) {
    return false;
    // throw new UnauthorizedException('Missing Authorization header!');
  }

  let decoded: jwt.JwtPayload | string;
  try {
    const signingKey = await getSigningKey(idToken);
    decoded = jwt.verify(idToken, signingKey);
  } catch (error) {
    logger.error('Error verifying JWT', error);
    return false;
    // throw new UnauthorizedException('Invalid or expired JWT!');
  }

  return decoded;
};
