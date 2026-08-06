import type { Metadata } from "next";
import { DM_Sans, Syne, Bebas_Neue } from "next/font/google";
import { auth } from "@/lib/auth";
import Providers from "@/components/providers";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas-neue",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "VizTR - Architectural Visualization Platform",
  description: "Create immersive 3D experiences for your architectural projects with real-time collaboration and AI-powered rendering.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await auth();
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${syne.variable} ${bebasNeue.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-white font-body">
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
