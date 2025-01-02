import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { NextAuthProvider } from '@/providers/NextAuthProvider';
import NavBar from '@/components/NavBar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ReCreate',
  description: 'クリエイターとユーザーをつなぐプラットフォーム',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <NextAuthProvider>
          <NavBar />
          <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
        </NextAuthProvider>
      </body>
    </html>
  );
} 