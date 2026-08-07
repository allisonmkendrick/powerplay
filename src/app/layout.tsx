import './globals.css';
import { Press_Start_2P, VT323, Nunito } from 'next/font/google';

// Self-hosted at build time by next/font, so no request to Google at runtime.
const pressStart = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-press-start',
  display: 'swap',
});

const vt323 = VT323({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-vt323',
  display: 'swap',
});

const nunito = Nunito({
  weight: ['600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
});

export const metadata = {
  title: 'PowerPlay',
  description: 'Sixty songs. One minute each. Built from your own playlists.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${pressStart.variable} ${vt323.variable} ${nunito.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
