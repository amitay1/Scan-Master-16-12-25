import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Mock session for development mode
const createDevSession = (): Session => ({
  access_token: 'dev-mode-token',
  refresh_token: 'dev-mode-refresh',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: {
    id: '00000000-0000-0000-0000-000000000000',
    email: 'dev@scan-master.local',
    aud: 'authenticated',
    role: 'authenticated',
    created_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: { full_name: 'Development User' },
  } as User,
});

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Dev mode authentication - enabled by default until user requests removal
    const checkDevMode = () => {
      // Check if dev_mode is explicitly disabled
      const devMode = localStorage.getItem('dev_mode');
      // If not set or set to 'true', use dev mode
      if (devMode !== 'false') {
        const devSession = createDevSession();
        setSession(devSession);
        setUser(devSession.user);
        setLoading(false);
        return true;
      }
      return false;
    };

    // Try dev mode first
    if (checkDevMode()) {
      return;
    }

    // If not in dev mode, use real authentication
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    // Keep dev_mode setting intact when signing out
    // User requested dev mode stays enabled until explicitly disabled
    await supabase.auth.signOut();
  };

  return { user, session, loading, signOut };
}
