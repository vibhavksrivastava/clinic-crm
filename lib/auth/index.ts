import {
  jwtVerify,
  SignJWT,
  JWTPayload as JoseJWTPayload,
} from 'jose';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';

const JWT_SECRET_RAW =
  process.env.JWT_SECRET ||
  '8fj29dj29d_ClinicCRM_2026_x92jd83n2jD';

const JWT_SECRET =
  new TextEncoder().encode(
    JWT_SECRET_RAW
  );

export async function getSessionFromRequest(
  req: NextRequest
) {
  const authHeader =
    req.headers.get(
      'authorization'
    );

  let token: string | null =
    null;

  if (
    authHeader?.startsWith(
      'Bearer '
    )
  ) {
    token =
      authHeader.replace(
        'Bearer ',
        ''
      );
  }

  if (!token) {
    token =
      req.cookies.get(
        'clinic_auth'
      )?.value ||
      req.cookies.get(
        'authToken'
      )?.value ||
      null;
  }

  console.log(
    'AUTH TOKEN EXISTS:',
    !!token
  );

  if (!token) return null;

  const session =
    await verifyToken(token);

  console.log(
    'SESSION DATA:',
    session
  );

  return session;
}
/**
 * ✅ Extend jose payload properly (fixes TS2345)
 */
export interface AppJWTPayload
  extends JoseJWTPayload {
  userId: string;
  email: string;
  roleType?: string;
  organizationId?: string;
  branchId?: string;
  permissions?: string[];
}

/**
 * SIGN TOKEN
 */
export async function signToken(
  payload: AppJWTPayload
): Promise<string> {
  return await new SignJWT(
    payload
  )
    .setProtectedHeader({
      alg: 'HS256',
    })
    .setIssuedAt()
    .setExpirationTime('1d')
    .sign(JWT_SECRET);
}

/**
 * VERIFY TOKEN
 */
export async function verifyToken(
  token: string
): Promise<AppJWTPayload | null> {
  try {
    const { payload } =
      await jwtVerify(
        token,
        JWT_SECRET
      );

    console.log(
      'JWT PAYLOAD:',
      payload
    );

    return payload as AppJWTPayload;
  } catch (error) {
    console.error(
      'VERIFY TOKEN ERROR:',
      error
    );
    return null;
  }
}

/**
 * PASSWORD HASH
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

/**
 * PASSWORD VERIFY
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}