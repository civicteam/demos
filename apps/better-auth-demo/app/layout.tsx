import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { ThemeProvider, type ThemeProviderProps } from "next-themes";
import type { ReactNode } from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Better Auth Demo",
  description: "Better Auth + Civic Nexus Demo",
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
        <ThemeProvider {...themeProps} />
      </body>
    </html>
  );
}
