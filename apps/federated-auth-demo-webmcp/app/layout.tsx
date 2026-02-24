import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";

import { basePath } from "../next.config";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

const fontFaceStyle = `@font-face {
  font-family: 'Auditype';
  src: url('${basePath}/auditype_extendednormal.ttf') format('truetype');
  font-weight: 400;
  font-display: swap;
}
@font-face {
  font-family: 'Auditype';
  src: url('${basePath}/auditype_extendedbold.ttf') format('truetype');
  font-weight: 700;
  font-display: swap;
}`;

export const metadata: Metadata = {
  title: "myAudi - Audi Garage",
  description: "myAudi – Your vehicles, service, and ownership",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} font-auditype-variable`}>
        <style dangerouslySetInnerHTML={{ __html: fontFaceStyle }} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
