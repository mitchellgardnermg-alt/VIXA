import React from 'react';

// Mock auth functions for deployment without Clerk
export const useUser = () => ({
  user: null,
  isLoaded: true,
  isSignedIn: false,
});

export const UserButton = () => null;
export const SignInButton = ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children);
