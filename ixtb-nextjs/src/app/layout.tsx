import { Toaster } from "@/src/components/ui/sonner.tsx";
import { kAppConstants } from "fimidx-core/definitions/appConstants";
import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import { Geist, Geist_Mono } from "next/font/google";
import { SidebarProvider } from "../components/ui/sidebar";
import "./globals.css";
import { GlobalStateProvider } from "../components/contexts/global-state-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: kAppConstants.name,
  description: kAppConstants.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          <GlobalStateProvider>
            <SidebarProvider>{children}</SidebarProvider>
          </GlobalStateProvider>
        </SessionProvider>
        <Toaster />
      </body>
    </html>
  );
}
