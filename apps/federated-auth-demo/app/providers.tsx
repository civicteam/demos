"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider, type ThemeProviderProps } from "next-themes";
import type { ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps): ReactNode {
  const themeProps: ThemeProviderProps & { children: ReactNode } = {
    attribute: "class",
    children,
  };

  return (
    <SessionProvider>
      <ThemeProvider {...themeProps} />
    </SessionProvider>
  );
}
