import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ConfirmDialogProvider } from "@/components/confirmationDialogProvider";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WebRTC with Supabase Realtime",
  description: "A WebRTC application using Supabase Realtime for signaling",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ConfirmDialogProvider>{children}</ConfirmDialogProvider>
      </body>
    </html>
  );
}
