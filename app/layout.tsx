import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VizTR',
  description: 'Architectural Visualization Platform',
};

export const viewport: Viewport = {
  themeColor: '#080a0f',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-bg text-white antialiased">{children}</body>
    </html>
  );
}