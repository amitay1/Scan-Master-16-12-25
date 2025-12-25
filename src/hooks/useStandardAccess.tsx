import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StandardType } from '@/types/techniqueSheet';

interface StandardAccess {
  hasAccess: boolean;
  isLoading: boolean;
  accessType: string | null;
  expiryDate: string | null;
  expired?: boolean;
}

export const useStandardAccess = (standardCode: StandardType): StandardAccess => {
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [accessType, setAccessType] = useState<string | null>(null);
  const [expiryDate, setExpiryDate] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    // First, wait for auth to be ready
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (isMounted) {
        setAuthReady(true);
        if (!session) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!authReady) return;

    let isMounted = true;
    
    const checkAccess = async (retryCount = 0) => {
      try {
        // Get fresh session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setHasAccess(false);
          setIsLoading(false);
          return;
        }
        
        if (!session?.access_token) {
          console.log('No valid session or access token');
          setHasAccess(false);
          setIsLoading(false);
          return;
        }
        
        // Verify the token is not 'null' or 'undefined' as string
        if (session.access_token === 'null' || session.access_token === 'undefined') {
          console.error('Access token is invalid string value');
          setHasAccess(false);
          setIsLoading(false);
          return;
        }

        // Verify token hasn't expired
        const tokenExpiry = session.expires_at ? new Date(session.expires_at * 1000) : null;
        const now = new Date();
        
        if (tokenExpiry && tokenExpiry <= now) {
          console.log('Token expired, refreshing session...');
          const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError || !newSession) {
            console.error('Failed to refresh session:', refreshError);
            setHasAccess(false);
            setIsLoading(false);
            return;
          }
          
          // Use the new session token
          session.access_token = newSession.access_token;
        }
        
        const { data, error } = await supabase.functions.invoke('validate-standard-access', {
          body: { standardCode },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!isMounted) return;

        if (error) {
          // Retry once on 401 with fresh token
          if (error.message?.includes('401') && retryCount === 0) {
            console.log('Got 401, refreshing session and retrying...');
            const { data: { session: freshSession } } = await supabase.auth.refreshSession();
            if (freshSession && isMounted) {
              // Wait a bit before retrying
              setTimeout(() => checkAccess(1), 500);
              return;
            }
          }
          
          console.error('Error checking standard access:', error);
          setHasAccess(false);
          setIsLoading(false);
          return;
        }

        setHasAccess(data.hasAccess);
        setAccessType(data.accessType);
        setExpiryDate(data.expiryDate);
        setExpired(data.expired || false);
        setIsLoading(false);
      } catch (error) {
        if (!isMounted) return;
        console.error('Error in useStandardAccess:', error);
        setHasAccess(false);
        setIsLoading(false);
      }
    };

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && isMounted) {
        checkAccess();
      } else if (!session && isMounted) {
        setHasAccess(false);
        setIsLoading(false);
      }
    });

    // Initial check
    checkAccess();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [standardCode, authReady]);

  return { hasAccess, isLoading, accessType, expiryDate, expired };
};
