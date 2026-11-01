import type { Metadata, Viewport } from "next";
import "./globals.css";
import { UtsavProvider } from "@/context/UtsavContext";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "VervePlan — Dream it. Plan it. Celebrate it.",
  description:
    "Tell VervePlan about your dream celebration, and watch AI transform your ideas into a personalized, organized, budget-conscious event plan.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF8FF" },
    { media: "(prefers-color-scheme: dark)", color: "#0F0B1A" },
  ],
};

const themeInitScript = `
(function() {
  try {
    var saved = localStorage.getItem('utsavai_theme_mode');
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="/utsav-theme.css" />
      </head>
      <body className="min-h-screen bg-utsav-bg bg-utsav-mesh text-utsav-text font-sans selection:bg-utsav-primary/20 selection:text-utsav-primary flex flex-col">
        {/* Accessible Skip to Content Link for Keyboard and Screen Reader Users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-utsav-primary focus:text-white focus:font-extrabold focus:rounded-xl focus:shadow-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-utsav-primary"
        >
          Skip to main content
        </a>
        <UtsavProvider>
          <Navbar />
          <main id="main-content" role="main" tabIndex={-1} className="flex-1 flex flex-col w-full focus:outline-none">
            {children}
          </main>
        </UtsavProvider>
      </body>
    </html>
  );
}
