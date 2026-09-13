import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AVON - لوحة الإدارة",
  description: "نظام إدارة مركز AVON للطب التجميلي",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased bg-avon-ivory">
        {children}
      </body>
    </html>
  );
}
