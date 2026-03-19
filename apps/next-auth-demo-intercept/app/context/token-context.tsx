"use client";

import type { ReactNode } from "react";
import { createContext, useContext } from "react";

type TokenContextType = {
  encryptedAccessToken?: string;
};

const TokenContext = createContext<TokenContextType | undefined>(undefined);

export function TokenProvider({
  children,
  encryptedAccessToken,
}: {
  children: ReactNode;
  encryptedAccessToken?: string;
}) {
  return <TokenContext.Provider value={{ encryptedAccessToken }}>{children}</TokenContext.Provider>;
}

export function useToken() {
  const context = useContext(TokenContext);
  if (context === undefined) {
    throw new Error("useToken must be used within a TokenProvider");
  }
  return context;
}
