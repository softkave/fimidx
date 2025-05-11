import { Toaster } from "@/src/components/ui/sonner.tsx";
import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import { Geist, Geist_Mono } from "next/font/google";
import { SidebarProvider } from "../components/ui/sidebar";
import { kAppConstants } from "../definitions/appConstants";
import "./globals.css";

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
          <SidebarProvider>{children}</SidebarProvider>
        </SessionProvider>
        <Toaster />
      </body>
    </html>
  );
}
