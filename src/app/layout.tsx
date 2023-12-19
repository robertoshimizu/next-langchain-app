import { ClerkProvider } from '@clerk/nextjs'
import './globals.css';
import { Inter } from 'next/font/google';
import Header from '@/src/components/header';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Langchain App',
  description: 'Langchain next app with tailwindcss and clerk auth',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <Header />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
