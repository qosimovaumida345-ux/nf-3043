import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mars IT — Kundalik Kod Tekshirish Platformasi (NF-3043)",
  description: "IT o'quvchilari uchun kundalik kod topshiriqlari va o'qituvchi tahlili tizimi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-white text-slate-900 font-inter">
        {children}
      </body>
    </html>
  );
}
