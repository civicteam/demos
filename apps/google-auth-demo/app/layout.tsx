import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider, type ThemeProviderProps } from "next-themes";
import type { ReactNode } from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Google Auth Demo",
  description: "Google OAuth + Civic Nexus Demo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const themeProps: ThemeProviderProps & { children: ReactNode } = {
    attribute: "class",
    children,
  };

  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <ThemeProvider {...themeProps} />
        </SessionProvider>
      </body>
    </html>
  );
}
