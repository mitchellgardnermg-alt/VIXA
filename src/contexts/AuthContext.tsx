"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isLocalhost =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    // Get initial session with error handling
    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.error('Auth session error:', error);
        }

        // If no session and in localhost, auto-create a mock session so sign-in UI never appears
        if (!session && isLocalhost) {
          console.log('AuthContext - Creating mock session for localhost');
          const mockUser: any = {
            id: 'dev-user-123',
            email: 'dev@localhost.com',
            user_metadata: { full_name: 'Development User' },
          };
          const mockSession: any = {
            user: mockUser,
            access_token: 'dev-token',
            refresh_token: 'dev-refresh-token',
          };
          setSession(mockSession);
          setUser(mockUser);
          setLoading(false);
          return;
        }

        setSession(session ?? null);
        setUser(session?.user ?? null);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Auth session catch error:', error);
        setLoading(false);
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    // For localhost development, bypass authentication
    const isLocalhost = typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    
    if (isLocalhost) {
      console.log('Localhost detected - bypassing authentication');
      const mockUser = {
        id: 'dev-user-123',
        email: email,
        user_metadata: {
          full_name: 'Development User'
        }
      };
      
      const mockSession = {
        user: mockUser,
        access_token: 'dev-token',
        refresh_token: 'dev-refresh-token'
      };
      
      setUser(mockUser);
      setSession(mockSession);
      setLoading(false);
      return;
    }
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    // For localhost development, bypass authentication
    const isLocalhost = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    
    if (isLocalhost) {
      console.log('Localhost detected - bypassing sign-up authentication');
      const mockUser = {
        id: 'dev-user-123',
        email: email,
        user_metadata: {
          full_name: 'Development User'
        }
      };
      
      const mockSession = {
        user: mockUser,
        access_token: 'dev-token',
        refresh_token: 'dev-refresh-token'
      };
      
      setUser(mockUser);
      setSession(mockSession);
      setLoading(false);
      return;
    }
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    // For localhost development, use a different approach
    const isLocalhost = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    
    if (isLocalhost) {
      // For localhost development, create a mock session
      console.log('Localhost detected - using development mode');
      const mockUser = {
        id: 'dev-user-123',
        email: 'dev@localhost.com',
        user_metadata: {
          full_name: 'Development User'
        }
      };
      
      const mockSession = {
        user: mockUser,
        access_token: 'dev-token',
        refresh_token: 'dev-refresh-token'
      };
      
      setUser(mockUser);
      setSession(mockSession);
      setLoading(false);
      return;
    }
    
    let redirectUrl = '/auth/callback';
    if (typeof window !== 'undefined') {
      redirectUrl = `${window.location.origin}/auth/callback`;
    }
    
    console.log('Google OAuth redirect URL:', redirectUrl);
    console.log('Is localhost:', isLocalhost);
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl
      }
    });
    if (error) {
      console.error('Google OAuth error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
