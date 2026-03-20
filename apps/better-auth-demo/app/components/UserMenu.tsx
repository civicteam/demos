"use client";

import { useSession, signOut } from "@/lib/auth/client";
import { Button } from "./ui/button";

export function UserMenu() {
  const { data: session } = useSession();

  if (!session?.user) {
    return null;
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-600 dark:text-gray-300 hidden md:inline-block">
        {session.user.email}
      </span>
      <Button variant="outline" size="sm" onClick={() => signOut().then(() => window.location.href = "/")}>
        Sign out
      </Button>
    </div>
  );
}
