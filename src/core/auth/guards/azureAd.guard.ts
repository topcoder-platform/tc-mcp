import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
    ForbiddenException,
  } from '@nestjs/common';
  import * as jwt from 'jsonwebtoken';
  import { JwtHeader, SigningKeyCallback } from 'jsonwebtoken';
  import { JwksClient } from 'jwks-rsa';
  import { ENV_CONFIG } from 'src/config';

  // Use the new, validated config variable
  const mockAzureAdValidation = ENV_CONFIG.MOCK_AZURE_AD_VALIDATION;
  if (mockAzureAdValidation)
    console.warn('Mock Azure AD validation enabled 🚀');

  const multiTenantClient = new JwksClient({
    jwksUri: `https://login.microsoftonline.com/common/discovery/v2.0/keys`,
  });

  const getSigningKey = (header: JwtHeader, callback: SigningKeyCallback) => {
    if (!header.kid) {
      return callback(new Error('JWT header is missing "kid" property.'));
    }
    multiTenantClient.getSigningKey(header.kid, (err, key) => {
      if (err) {
        return callback(err);
      }
      const signingKey = key?.getPublicKey();
      callback(null, signingKey);
    });
  };

  @Injectable()
  export class AzureAdGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest();
      const authHeader = request.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('No token provided.');
      }

      const token = authHeader.substring(7);

      if (mockAzureAdValidation) {
        request.user = { oid: token };
        return true;
      }

      try {
        const payload = await this.verifyToken(token);
        request.user = payload;
        return true;
      } catch (error) {
        throw error;
      }
    }

    private verifyToken(token: string): Promise<jwt.JwtPayload> {
      return new Promise((resolve, reject) => {
        jwt.verify(
          token,
          getSigningKey,
          {
            audience: ENV_CONFIG.AZURE_AD_AUDIENCE,
            algorithms: ['RS256'],
          },
          (err, decoded) => {
            if (err) {
              return reject(
                new UnauthorizedException('Invalid token.', err.message),
              );
            }

            const payload = decoded as jwt.JwtPayload;

            if (
              ENV_CONFIG.IS_SAME_AZURE_AD_TENANT && // Corrected reference
              payload.tid !== ENV_CONFIG.AZURE_AD_TENANT_ID // Corrected reference
            ) {
              return reject(
                new ForbiddenException('User is not from the correct tenant.'),
              );
            }

            resolve(payload);
          },
        );
      });
    }
  }