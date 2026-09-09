import type { Metadata } from 'next';
import { DM_Sans, Playfair_Display } from 'next/font/google';
import './globals.css';

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
});

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://securely-loved-attachment-profile.veronica388151.chatgpt.site'),
  title: 'Personalized Attachment Profile | Securely Loved',
  description: 'A personalized attachment profile created by Bev Mitelman, M.A.',
  openGraph: {
    title: 'Personalized Attachment Profile | Securely Loved',
    description: 'Understand the patterns behind how you love, communicate, and repair.',
    images: ['/securely-loved-logo.png'],
  },
  twitter: {
    card: 'summary',
    title: 'Personalized Attachment Profile | Securely Loved',
    description: 'Understand the patterns behind how you love, communicate, and repair.',
    images: ['/securely-loved-logo.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${dmSans.variable} ${playfair.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
