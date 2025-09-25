"use client";

import { SignInButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/Button';

export default function AuthSignInButton() {
  return (
    <SignInButton mode="modal">
      <Button variant="primary" size="md">
        Sign In
      </Button>
    </SignInButton>
  );
}


