import type { Metadata } from "next";
import { Noto_Sans_JP, Quicksand } from "next/font/google";
import "./globals.css";

const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto-sans-jp",
});

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
});

export const metadata: Metadata = {
  title: "Stockee - 暮らしの在庫管理",
  description: "日用品や食料品の在庫をスマホで簡単に管理。家族やルームメイトと共有もできる在庫管理アプリ。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${notoSansJp.variable} ${quicksand.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
