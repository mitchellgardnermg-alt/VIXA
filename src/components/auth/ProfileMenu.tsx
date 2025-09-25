"use client";

import { useRouter } from 'next/navigation';
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Button } from "@/components/ui/Button";
import { BackpackIcon, PersonIcon } from "@radix-ui/react-icons";

export default function ProfileMenu() {
  const router = useRouter();
  
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant="outline" size="md">
          <PersonIcon className="mr-2 h-4 w-4" /> Profile
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content className="min-w-48 bg-neutral-900 text-neutral-100 border border-white/10 rounded p-2 space-y-1">
        <DropdownMenu.Item 
          className="flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10 cursor-pointer"
          onClick={() => router.push('/pricing')}
        >
          <BackpackIcon className="h-4 w-4" />
          Pricing
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}


