import type { Metadata, Viewport } from "next";
import { Baloo_2, Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { AppShell } from "@/components/AppShell";
import { AuthSessionProvider } from "@/components/AuthSessionProvider";
import { BottomTabBar } from "@/components/BottomTabBar";
import { Footer } from "@/components/Footer";
import { GoogleMapsProvider } from "@/components/GoogleMapsProvider";
import { Header } from "@/components/Header";
import { ToastProvider } from "@/components/ToastProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Krój logotypu i nagłówków — miękkie, zaokrąglone litery utrzymują ciepły
// charakter marki nawet w wersji KARNET.asist pisanej wersalikami.
const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "KARNET.asist",
  description: "Twoje karnety zawsze pod ręką.",
};

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#faf9f7",
};

// Ustawia data-theme na <html> zanim strona się wyrenderuje, żeby uniknąć
// mignięcia złym motywem. Ta sama logika co applyTheme() w prototypie.
const THEME_INIT_SCRIPT = `
  (function () {
    try {
      var stored = localStorage.getItem('theme');
      var theme = stored === 'dark' || stored === 'light'
        ? stored
        : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      document.documentElement.setAttribute('data-theme', theme);
    } catch (e) {}
  })();
`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${baloo.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider>
          <AuthSessionProvider>
            <ToastProvider>
              <GoogleMapsProvider>
                <AppShell header={<Header />} footer={<Footer />} bottomTabBar={<BottomTabBar />}>
                  {children}
                </AppShell>
              </GoogleMapsProvider>
            </ToastProvider>
          </AuthSessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
