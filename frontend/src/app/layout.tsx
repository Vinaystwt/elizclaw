import '../styles/globals.css';
import { Sidebar } from '@/components/Sidebar';

export const metadata = {
  title: 'ElizClaw — Personal Automation Agent',
  description: 'Set it once, it runs forever.',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#08080d] bg-grid">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-72 p-8 lg:p-10">{children}</main>
        </div>
      </body>
    </html>
  );
}
