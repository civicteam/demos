"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

import { Button } from "../components/ui/button";

export default function SignOutButton() {
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut({ callbackUrl: "/" });
    } catch (error) {
      console.error("Error signing out:", error);
      setIsSigningOut(false);
    }
  };

  return (
    <Button
      className="w-full inline-flex justify-center items-center"
      disabled={isSigningOut}
      variant="outline"
      onClick={handleSignOut}
    >
      {isSigningOut ? "Signing out..." : "Sign out"}
    </Button>
  );
}
