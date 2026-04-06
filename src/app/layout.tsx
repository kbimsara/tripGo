import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "TripGo - AI-Powered Trip Planner",
  description:
    "Plan your perfect trip with AI. Get personalized itineraries, directions, and viewpoints — then customize with chat.",
  keywords: ["trip planning", "travel", "AI", "itinerary", "maps"],
  openGraph: {
    title: "TripGo - AI-Powered Trip Planner",
    description: "Plan your perfect trip with AI",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <SessionProvider>
          <ToastProvider>{children}</ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
