import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PINO — Creative Club for Kids",
  description:
    "A creative club where children explore art, music and their own way of making.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
