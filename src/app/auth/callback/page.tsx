"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthCallback() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // User is authenticated, redirect to app
        router.push('/app');
      } else {
        // No user found, redirect to home
        router.push('/');
      }
    }
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
