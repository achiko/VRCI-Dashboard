// src/app/layout.tsx

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { DashboardLayout } from '@/components/dashboard-layout';
import { WalletAuthGuard } from '@/components/auth/wallet-auth-guard';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Providers from './providers';
import TypinkWrapper from './typink-wrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'W3PI - Web3 Portfolio Intelligence',
  description: 'A decentralized portfolio management platform built with ink! smart contracts',
  keywords: ['Web3', 'DeFi', 'Portfolio', 'Polkadot', 'ink!', 'Smart Contracts'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen`}>
        <Providers>
          <TypinkWrapper>
            <WalletAuthGuard>
              <DashboardLayout>
                {children}
              </DashboardLayout>
            </WalletAuthGuard>
            {/* <ToastContainer
              position="bottom-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            /> */}
          </TypinkWrapper>
        </Providers>
      </body>
    </html>
  );
}