import type { Metadata } from 'next';
import './globals.css';
import { Navigation } from '@/components/navigation';
import { Providers } from '@/components/providers';

// Use system font instead of Google Fonts to avoid network issues
// You can switch back to Inter once network is available
const fontStyle = { fontFamily: 'system-ui, -apple-system, sans-serif' };

export const metadata: Metadata = {
  title: 'Test Management System',
  description: 'Comprehensive test management tool',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={fontStyle}>
        <Providers>
          <div className="min-h-screen bg-gray-50">
            <Navigation />
            <main className="container mx-auto px-4 py-8">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
