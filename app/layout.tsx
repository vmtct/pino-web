import type { Metadata } from "next";
import "./globals.css";
import CmsHydrator from "./cms-hydrator";

export const metadata: Metadata = {
  title: "PINO House — Ngôi nhà sáng tạo cho trẻ em",
  description:
    "PINO House là nơi trẻ khám phá Art và Piano qua Open Studio, rồi phát triển sâu hơn cùng Premium Journey.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body><CmsHydrator />{children}</body>
    </html>
  );
}
