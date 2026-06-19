import type { Session } from '@supabase/supabase-js';

const LOGIN_EVENT_STORAGE_KEY = 'ga4:lastTrackedLogin';
let lastTrackedLoginInMemory = '';

function getLoginIdentifier(session: Session): string {
  const signedInAt = session.user.last_sign_in_at ?? 'unknown';
  return `${session.user.id}:${signedInAt}`;
}

function hasTrackedLogin(identifier: string): boolean {
  if (lastTrackedLoginInMemory === identifier) return true;
  try {
    return window.localStorage.getItem(LOGIN_EVENT_STORAGE_KEY) === identifier;
  } catch {
    return false;
  }
}

function rememberTrackedLogin(identifier: string): void {
  lastTrackedLoginInMemory = identifier;
  try {
    window.localStorage.setItem(LOGIN_EVENT_STORAGE_KEY, identifier);
  } catch {
    // In-memory deduplication still prevents duplicate events in this page session.
  }
}

export function trackLoginCompleted(session: Session): void {
  if (session.user.is_anonymous) return;

  const identifier = getLoginIdentifier(session);
  if (hasTrackedLogin(identifier)) return;

  rememberTrackedLogin(identifier);
  window.gtag?.('event', 'login', {
    method: session.user.app_metadata.provider ?? 'unknown',
  });
}

export function clearTrackedLogin(): void {
  lastTrackedLoginInMemory = '';
  try {
    window.localStorage.removeItem(LOGIN_EVENT_STORAGE_KEY);
  } catch {
    // Ignore storage access failures.
  }
}
