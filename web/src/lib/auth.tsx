import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface AuthState {
  session: Session | null;
  loading: boolean;
}
const AuthContext = createContext<AuthState>({ session: null, loading: true });

/** Holds the Supabase session for the app (email code sign-in, ADR-006). */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ session: null, loading: !!supabase });
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setState({ session: data.session, loading: false }));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setState({ session, loading: false }));
    return () => data.subscription.unsubscribe();
  }, []);
  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

/** Sends signed-out visitors to /sign-in and brings them back afterwards. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const loc = useLocation();
  if (loading) return null;
  if (!session) return <Navigate to={`/sign-in?next=${encodeURIComponent(loc.pathname)}`} replace />;
  return <>{children}</>;
}
