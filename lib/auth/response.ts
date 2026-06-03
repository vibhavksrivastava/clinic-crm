import { signToken } from './index';

/**
 * Safer reusable types (no any)
 */
export type AppUser = {
  id: string;
  email: string;
  role?: {
    id: string;
    roleType?: string;
    name?: string;
    permissions?: string[];
  };
};

export type Organization = {
  id: string;
  name?: string;
  email?: string;
};

export type Branch = {
  id: string;
  name?: string;
} | null;

/**
 * LOGIN RESPONSE TYPE
 */
export type LoginResponse = {
  user: AppUser;
  organization: Organization;
  branch: Branch;
  token: string;
};

/**
 * CREATE LOGIN RESPONSE (FIXED - NO ANY)
 */
export async function createLoginResponse(
  user: AppUser,
  organization: Organization,
  branch?: Branch
): Promise<LoginResponse> {
  const token = await signToken({
    userId: user.id,
    email: user.email,
    role: user.role?.roleType,
  });

  return {
    user,
    organization,
    branch: branch ?? null,
    token,
  };
}