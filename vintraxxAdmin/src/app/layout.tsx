import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/ThemeProvider';
import { AuthProvider } from '@/lib/auth';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
  title: 'VinTraxx Admin',
  description: 'VinTraxx SmartScan Administration Panel',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster richColors position="top-right" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
