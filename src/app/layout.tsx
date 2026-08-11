import type { Metadata, Viewport } from 'next';
import { Rubik, Assistant, Roboto_Mono } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/components/app-providers';

const rubik = Rubik({
  subsets: ['hebrew', 'latin'],
  weight: ['500', '600', '700'],
  variable: '--font-rubik',
  display: 'swap',
});

const assistant = Assistant({
  subsets: ['hebrew', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-assistant',
  display: 'swap',
});

const mono = Roboto_Mono({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-mono',
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
    statusBarStyle: 'black-translucent',
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0b0c0e' },
    { media: '(prefers-color-scheme: light)', color: '#f7f7f5' },
  ],
};

/**
 * Applies the stored theme before first paint so the app never flashes the
 * wrong palette. Kept inline and tiny on purpose.
 */
const themeScript = `(function(){try{var raw=localStorage.getItem('maslul-state');var s=raw?(JSON.parse(raw).state||{}).theme:'dark';s=s||'dark';var d=s==='dark'||(s==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';}catch(e){document.documentElement.dataset.theme='dark';}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="he"
      dir="rtl"
      data-theme="dark"
      className={`${rubik.variable} ${assistant.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
