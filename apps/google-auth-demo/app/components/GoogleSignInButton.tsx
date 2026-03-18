"use client";

import { signIn } from "next-auth/react";
import { Button } from "./ui/button";

export function GoogleSignInButton() {
  return (
    <Button onClick={() => signIn("google")} className="w-full max-w-sm">
      Sign in with Google
    </Button>
  );
}
