import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { type Session, type AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { UserRole, type AuthUser, type LoginFormData, type RegisterFormData } from '../types/auth';

interface AuthState {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (data: LoginFormData) => Promise<{ error: AuthError | null }>;
  register: (data: RegisterFormData) => Promise<{ error: AuthError | null }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchUserProfile(userId: string): Promise<AuthUser | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, role, first_name, last_name')
    .eq('id', userId)
    .single();

  if (error || !data) return null;

  const row = data as {
    id: string;
    email: string;
    role: string;
    first_name: string;
    last_name: string;
  };

  return {
    id: row.id,
    email: row.email,
    role: row.role as UserRole,
    firstName: row.first_name,
    lastName: row.last_name,
  };
}

export function AuthProvider({ children }: { children: ReactNode }): ReactNode {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });

  useEffect(() => {
    // Restore session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        setState({ user: profile, session, loading: false });
      } else {
        setState({ user: null, session: null, loading: false });
      }
    });

    // Listen for auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        setState({ user: profile, session, loading: false });
      } else {
        setState({ user: null, session: null, loading: false });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(
    async (data: LoginFormData): Promise<{ error: AuthError | null }> => {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      return { error };
    },
    [],
  );

  const register = useCallback(
    async (data: RegisterFormData): Promise<{ error: AuthError | null }> => {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            role: data.role,
            first_name: data.firstName,
            last_name: data.lastName,
          },
        },
      });

      // When email confirmation is disabled, signUp returns a session immediately.
      // Eagerly update state so navigation to a protected route works right away.
      if (!error && authData.session) {
        let profile = await fetchUserProfile(authData.session.user.id);
        if (!profile) {
          // DB trigger may not have run yet; build profile from sign-up data
          profile = {
            id: authData.session.user.id,
            email: data.email,
            role: data.role as UserRole,
            firstName: data.firstName,
            lastName: data.lastName,
          };
        }
        setState({ user: profile, session: authData.session, loading: false });
      }

      return { error };
    },
    [],
  );

  const logout = useCallback(async (): Promise<void> => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
