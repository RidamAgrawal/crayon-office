import jwksClient from 'jwks-rsa';
import jwt from 'jsonwebtoken';

const client = jwksClient({
  jwksUri: 'https://login.microsoftonline.com/common/discovery/v2.0/keys',
});

function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    callback(null, key?.getPublicKey());
  });
}

export function verifyMicrosoftToken(idToken: string): Promise<jwt.JwtPayload> {
  return new Promise((resolve, reject) => {
    jwt.verify(
      idToken,
      getKey,
      {
        audience: process.env.MICROSOFT_CLIENT_ID,
      },
      (err: any, decoded: any) => {
        if (err || !decoded) return reject(err ?? new Error('Invalid token'));
        const payload = decoded as jwt.JwtPayload;
        const issuer = payload.iss ?? '';
        if (!/^https:\/\/login\.microsoftonline\.com\/.*\/v2\.0$/.test(issuer)) {
          return reject(new Error('Invalid issuer'));
        }
        resolve(payload);
      },
    );
  });
}
