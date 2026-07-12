import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Manage Money — Manajemen Keuangan Keluarga",
  description: "Aplikasi manajemen keuangan keluarga yang cerdas dan terpercaya",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-background">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 min-w-0 overflow-x-hidden lg:ml-64 px-4 md:px-6 lg:px-8 py-6 pb-32 lg:pb-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
