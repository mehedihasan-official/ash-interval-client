import Footer from "@/components/shared/Footer";
import Header from "@/components/shared/Header";
import { AuthProvider } from "@/lib/providers/AuthProvider";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
    >
      <body className="min-h-full flex flex-col">
        {/* AuthProvider wraps everything so Header, Login, and every
            future page can access the logged-in user via useAuth() */}
        <AuthProvider>
          <Header />
          <main className="grow">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
