"use client";

import { UserButton } from '@/lib/auth';

export default function AuthUserButton() {
  return (
    <UserButton 
      afterSignOutUrl="/"
      appearance={{
        elements: {
          userButtonPopoverCard: "bg-neutral-900 border border-white/10",
          userButtonPopoverActionButton: "text-white hover:bg-white/10",
          userButtonPopoverFooter: "hidden"
        }
      }}
    />
  );
}