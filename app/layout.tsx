import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import '../styles/globals.css';
import { Providers } from './providers';

export const metadata: Metadata = { title: 'Systory HRMS', icons: { icon: '/systory-logo.jpg' } };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#046262' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="lo" data-theme="light" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
