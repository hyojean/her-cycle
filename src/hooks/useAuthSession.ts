import { useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';

export type AuthStatus = {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  isAuthenticated: boolean;
  displayName: string;
  email: string | null;
};

function isAnonymousUser(user: User | null): boolean {
  return Boolean(user?.is_anonymous);
}

export function getUserDisplayName(user: User | null): string {
  if (!user || isAnonymousUser(user)) return '게스트';
  const metadata = user.user_metadata ?? {};
  const rawName =
    metadata.full_name ??
    metadata.name ??
    metadata.nickname ??
    metadata.user_name ??
    user.email?.split('@')[0];
  return typeof rawName === 'string' && rawName.trim() ? rawName.trim() : '사용자';
}

export function useAuthSession(): AuthStatus {
  const configured = isSupabaseConfigured();
  const [loading, setLoading] = useState(configured);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      setSession(null);
      return;
    }

    const sb = getSupabase();
    if (!sb) {
      setLoading(false);
      setSession(null);
      return;
    }

    let mounted = true;
    sb.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data } = sb.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [configured]);

  return useMemo(() => {
    const user = session?.user ?? null;
    const isAuthenticated = Boolean(user && !isAnonymousUser(user));
    return {
      configured,
      loading,
      session,
      user,
      isAuthenticated,
      displayName: getUserDisplayName(user),
      email: isAuthenticated ? user?.email ?? null : null,
    };
  }, [configured, loading, session]);
}
