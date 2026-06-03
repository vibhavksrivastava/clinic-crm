//const attempts = new Map<string, { count: number; lastAttempt: number }>();
type AttemptRecord = {
  count: number;
  lastAttempt: number;
};

const attemptsMap = new Map<string, AttemptRecord>();

const MAX_ATTEMPTS = 5;
//const LOCK_TIME_MS = 15 * 60 * 1000; // 15 min

export function checkLoginAttempts(userId: string): {
  allowed: boolean;
  message?: string;
} {
  const attempts = attemptsMap.get(userId);

  if (attempts && attempts.count >= MAX_ATTEMPTS) {
    return {
      allowed: false,
      message: 'Too many login attempts. Try later.',
    };
  }

  return {
    allowed: true,
  };
}
export function recordLoginAttempt(userId: string, success: boolean) {
  const record = attemptsMap.get(userId) || { count: 0, lastAttempt: 0 };

  if (success) {
    attemptsMap.delete(userId);
    return;
  }

  record.count += 1;
  record.lastAttempt = Date.now();

  attemptsMap.set(userId, record);
}

export function clearLoginAttempts(userId: string) {
  attemptsMap.delete(userId);
}