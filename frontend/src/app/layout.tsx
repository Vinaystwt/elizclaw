import '../styles/globals.css';
import { Sidebar } from '@/components/Sidebar';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export const metadata = {
  title: 'ElizClaw — On-Chain Intelligence Agent',
  description: 'Your agent, your data, your infrastructure. Always watching.',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <ErrorBoundary>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-60 p-6 lg:p-8 relative z-10">{children}</main>
          </div>
        </ErrorBoundary>
      </body>
    </html>
  );
}
