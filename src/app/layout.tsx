// app/layout.tsx

import type { Metadata } from "next";
// 1. Change the import from 'google' to 'local'
import localFont from "next/font/local";
import "./globals.css";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { ConvexClientProvider } from "./ConvexClientProvider";

// 2. Configure the fonts to load from your local files
const geistSans = localFont({
  src: './fonts/Geist-Variable.woff2',
  variable: "--font-geist-sans", // This CSS variable name is kept the same
  display: 'swap',
});

const geistMono = localFont({
  src: './fonts/GeistMono-Variable.woff2',
  variable: "--font-geist-mono", // This CSS variable name is kept the same
  display: 'swap',
});

// The metadata remains unchanged
export const metadata: Metadata = {
  title: "Mediant International Limited Field Logs App",
  description: "Field logs App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="en">
        {/* 3. The className here works exactly as before, no changes needed */}
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}