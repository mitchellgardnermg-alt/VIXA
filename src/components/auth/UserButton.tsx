"use client";

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';

export default function AuthUserButton() {
  const { user, signOut } = useAuth();

  if (!user) return null;

  return (
    <div className="flex items-center gap-3">
      <div className="text-sm text-white/80">
        {user.email}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => signOut()}
        className="text-xs"
      >
        Sign Out
      </Button>
    </div>
  );
}