import bcrypt from 'bcryptjs';

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Password strength validation
 */
export function validatePasswordStrength(password: string): boolean {
  // min 6 chars (you can improve later)
  return typeof password === 'string' && password.length >= 6;
}

/**
 * Hash password
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

/**
 * Compare password
 */
export async function verifyPassword(
  password: string,
  hashed: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashed);
}