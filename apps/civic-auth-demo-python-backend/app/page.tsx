"use client";

import { UserButton } from "@civic/auth/react";
import { useUser } from "@civic/auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/python-backend");
    }
  }, [user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <main className="flex flex-col items-center gap-8">
        <h1 className="text-2xl font-bold">Python Backend Demo</h1>
        <UserButton />
      </main>
    </div>
  );
}
