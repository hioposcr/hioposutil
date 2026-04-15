export interface AuthSession {
  username: string;
  issuedAt: number;
  lastActivityAt: number;
  expiresAt: number;
}

export const AUTH_SESSION_STORAGE_KEY = 'hioposutil_auth_session';
export const AUTH_SESSION_DURATION_MS = 5 * 60 * 60 * 1000;
export const AUTH_SESSION_WARNING_MS = 15 * 60 * 1000;

function isValidTimestamp(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

export function createAuthSession(username: string, now = Date.now()): AuthSession {
  return {
    username,
    issuedAt: now,
    lastActivityAt: now,
    expiresAt: now + AUTH_SESSION_DURATION_MS,
  };
}

export function extendAuthSession(session: AuthSession, now = Date.now()): AuthSession {
  return {
    ...session,
    lastActivityAt: now,
    expiresAt: now + AUTH_SESSION_DURATION_MS,
  };
}

export function persistAuthSession(session: AuthSession): void {
  window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearAuthSession(): void {
  window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
}

export function getStoredAuthSession(now = Date.now()): AuthSession | null {
  const rawSession = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY);

  if (!rawSession) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawSession) as Partial<AuthSession>;

    if (
      typeof parsed.username !== 'string' ||
      !isValidTimestamp(parsed.issuedAt) ||
      !isValidTimestamp(parsed.lastActivityAt) ||
      !isValidTimestamp(parsed.expiresAt)
    ) {
      clearAuthSession();
      return null;
    }

    if (parsed.expiresAt <= now) {
      clearAuthSession();
      return null;
    }

    return {
      username: parsed.username,
      issuedAt: parsed.issuedAt,
      lastActivityAt: parsed.lastActivityAt,
      expiresAt: parsed.expiresAt,
    };
  } catch {
    clearAuthSession();
    return null;
  }
}

export function getSessionRemainingMs(session: AuthSession, now = Date.now()): number {
  return Math.max(0, session.expiresAt - now);
}

export function shouldWarnAboutSessionExpiry(session: AuthSession, now = Date.now()): boolean {
  const remaining = getSessionRemainingMs(session, now);
  return remaining > 0 && remaining <= AUTH_SESSION_WARNING_MS;
}

export function formatRemainingTime(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
}
