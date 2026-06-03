import { SignJWT } from 'jose';

export const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET
);

export async function signToken(payload: Record<string, unknown>) {
  return await new SignJWT(payload)
    .setProtectedHeader({
      alg: 'HS256',
    })
    .setIssuedAt()
    .setExpirationTime('1d')
    .sign(JWT_SECRET);
}