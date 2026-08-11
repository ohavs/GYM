import type { Metadata, Viewport } from 'next';
import { Rubik } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/components/app-providers';

const rubik = Rubik({
  subsets: ['hebrew', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-rubik',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'מסלול - אימונים שנבנים סביבך',
  description:
    'אפליקציית אימונים בעברית עם 1,324 תרגילים מודגמים, תוכנית שנבנית לפי המטרה והציוד שלך, ומרחב עבודה למאמנים.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'מסלול',
    statusBarStyle: 'default',
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#f6f4fa',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={rubik.variable} suppressHydrationWarning>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
