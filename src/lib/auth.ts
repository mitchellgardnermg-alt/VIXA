import React, { useState, useEffect } from 'react';

// Simple local auth system without Clerk
let authState = {
  user: null,
  isLoaded: true,
  isSignedIn: false,
};

const authListeners = new Set<() => void>();

const notifyListeners = () => {
  authListeners.forEach(listener => listener());
};

export const useUser = () => {
  const [, forceUpdate] = useState({});
  
  useEffect(() => {
    const listener = () => forceUpdate({});
    authListeners.add(listener);
    return () => authListeners.delete(listener);
  }, []);

  return authState;
};

export const signIn = (email: string, password: string) => {
  // Simple mock sign-in - always succeeds
  authState = {
    user: { id: '1', emailAddresses: [{ emailAddress: email }] },
    isLoaded: true,
    isSignedIn: true,
  };
  notifyListeners();
  return Promise.resolve();
};

export const signOut = () => {
  authState = {
    user: null,
    isLoaded: true,
    isSignedIn: false,
  };
  notifyListeners();
  return Promise.resolve();
};

export const UserButton = ({ afterSignOutUrl }: { afterSignOutUrl?: string }) => {
  const { isSignedIn } = useUser();
  
  if (!isSignedIn) return null;
  
  return (
    <button
      onClick={() => signOut()}
      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
    >
      Sign Out
    </button>
  );
};

export const SignInButton = ({ children, mode }: { children: React.ReactNode; mode?: string }) => {
  const { isSignedIn } = useUser();
  
  if (isSignedIn) return null;
  
  const handleSignIn = () => {
    const email = prompt('Enter your email:');
    if (email) {
      signIn(email, 'password');
    }
  };
  
  return (
    <button onClick={handleSignIn} className="w-full">
      {children}
    </button>
  );
};
