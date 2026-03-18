import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { CivicAuthProvider } from "@civic/auth/nextjs";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Civic Auth Demo",
  description: "Civic Auth + Civic Nexus Demo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CivicAuthProvider>
          {children}
        </CivicAuthProvider>
      </body>
    </html>
  );
}
