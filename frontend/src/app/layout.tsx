import "../styles/globals.css";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { Sidebar } from "@/components/Sidebar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { MobileTabBar } from "@/components/MobileTabBar";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: ["400", "500", "600", "700", "800"],
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "500"],
});

export const metadata = {
  title: "ElizClaw — Personal intelligence desk",
  description: "A calm on-chain intelligence layer that watches, briefs, and keeps your morning clear.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${jetBrainsMono.variable}`}>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body className="app-shell">
        <a className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-surface-2 focus:px-4 focus:py-2 focus:text-text-primary" href="#main-content">
          Skip to content
        </a>
        <ErrorBoundary>
          <div className="page-shell">
            <Sidebar />
            <main className="content-shell" id="main-content">
              {children}
            </main>
          </div>
          <MobileTabBar />
        </ErrorBoundary>
      </body>
    </html>
  );
}
