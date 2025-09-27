"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [checkingUser, setCheckingUser] = useState(true);

  useEffect(() => {
    const checkUserAndRedirect = async () => {
      if (!loading && user) {
        try {
          // Check if this is a new user by looking at created_at timestamp
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('created_at, subscription_tier')
            .eq('id', user.id)
            .single();

          if (error && error.code === 'PGRST116') {
            // Profile doesn't exist, this is a new user
            console.log('New user detected, redirecting to pricing');
            router.push('/pricing?new_user=true');
            return;
          }

          if (profile) {
            // Check if user was created in the last 5 minutes (new user)
            const createdAt = new Date(profile.created_at);
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            
            if (createdAt > fiveMinutesAgo) {
              console.log('New user detected, redirecting to pricing');
              router.push('/pricing?new_user=true');
              return;
            }
          }

          // Existing user, redirect to app
          console.log('Existing user, redirecting to app');
          router.push('/app');
        } catch (error) {
          console.error('Error checking user:', error);
          // Fallback: redirect to app
          router.push('/app');
        }
      } else if (!loading && !user) {
        // No user found, redirect to home
        router.push('/');
      }
      setCheckingUser(false);
    };

    checkUserAndRedirect();
  }, [user, loading, router]);

  return (
    <div className="h-screen bg-[#0A0F0C] flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white/60">Completing sign in...</p>
      </div>
    </div>
  );
}
