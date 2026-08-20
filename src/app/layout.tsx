import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://codeviz.dev"),
  title: {
    default: "CodeViz — watch your code think",
    template: "%s · CodeViz",
  },
  description:
    "Interactive programming tutorials for C, Java, C# and Linux. Step through memory, pointers, the call stack and the heap in a live visualization instead of reading static text.",
  keywords: [
    "C tutorial",
    "pointer visualization",
    "memory visualizer",
    "call stack",
    "learn C interactively",
  ],
  openGraph: {
    type: "website",
    siteName: "CodeViz",
    title: "CodeViz — watch your code think",
    description:
      "Step-through visualizations of memory, pointers and the call stack.",
  },
};

/**
 * Resolves theme and classroom mode before first paint. Inline on purpose —
 * a flash of the wrong theme on a dark, high-contrast diagram is jarring.
 */
const bootstrap = `(function(){try{
var t=localStorage.getItem('codeviz-theme');
var dark=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;
document.documentElement.dataset.theme=dark?'dark':'light';
if(/[?&]classroom=1/.test(location.search))document.documentElement.dataset.classroom='1';
}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-theme="light"
      // font variables belong on :root so base-layer CSS can reach them
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootstrap }} />
      </head>
      <body className="min-h-screen antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:border focus:border-steel focus:bg-surface focus:px-3 focus:py-2 focus:text-sm"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
