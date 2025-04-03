import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import RouteRestorer from "@/components/Common/Auth/RouteRestorer";
import { AudioProvider } from "@/lib/contexts/AudioContext";
import { NotificationProvider } from "@/components/Common/Notifications";
import AudioWrapper from "@/components/Common/Music/AudioWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Doki Doki Productivity Club",
  description: "A productivity club for the Doki Doki community",
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
        <AudioProvider>
          <NotificationProvider>
            <RouteRestorer />
            {children}
            <AudioWrapper />
          </NotificationProvider>
        </AudioProvider>
      </body>
    </html>
  );
}
