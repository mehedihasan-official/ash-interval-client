import BackButtonBar from "@/components/shared/BackButtonBar";
import Footer from "@/components/shared/Footer";
import { AuthProvider } from "@/lib/providers/AuthProvider";
import { ThemeProvider } from "@/lib/providers/ThemeProvider";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/shared/Header";

// We used to inject a `<script>` here to set the theme class before
// hydration, but React 19 bails out of hydration when a component
// renders a raw <script> tag (even with the type-swap workaround the
// Next docs recommend). We now handle the initial theme entirely in
// ThemeProvider's effect — dark-mode users see a very brief light
// flash on first load, which is a fine trade for a clean hydration
// with no fragile workarounds.

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Interval - Vacation Ownership & Resort Exchange",
  description: "Private resort booking platform",
  icons: {
    icon: "/faveicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-white dark:bg-[#0f172a] text-[#1a1a1a] dark:text-[#f1f5f9] transition-colors"
        suppressHydrationWarning
      >
        {/* ThemeProvider + AuthProvider wrap everything so Header, Login,
            and every future page can access theme + logged-in user via
            useTheme() / useAuth() */}
        <ThemeProvider>
          <AuthProvider>
            <Header />
            {/* Site-wide back button — hides itself on home/dashboard/
                auth pages, renders on every inner page (booking flows,
                admin sub-pages, resort detail, etc.). Placed here
                instead of per-page so future pages get it for free. */}
            <BackButtonBar />
            <main className="grow">{children}</main>
            <Footer />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
