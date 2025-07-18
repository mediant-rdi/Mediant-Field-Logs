// app/layout.tsx

// 1. Import Viewport alongside Metadata
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { ConvexClientProvider } from "./ConvexClientProvider";

// Your local font configuration remains the same
const geistSans = localFont({
  src: './fonts/Geist-Variable.woff2',
  variable: "--font-geist-sans",
  display: 'swap',
});

const geistMono = localFont({
  src: './fonts/GeistMono-Variable.woff2',
  variable: "--font-geist-mono",
  display: 'swap',
});

// 2. Updated Metadata to link the PWA manifest
export const metadata: Metadata = {
  title: "Mediant International Limited Field Logs App",
  description: "Field logs App",
  manifest: "/manifest.webmanifest",
};

// 3. Added Viewport settings for a better mobile/PWA experience
export const viewport: Viewport = {
  themeColor: "#000000",
  initialScale: 1,
  width: "device-width",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}