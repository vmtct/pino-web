import type { Metadata } from "next";
import "./globals.css";
import CmsHydrator from "./cms-hydrator";

export const metadata: Metadata = {
  title: "PINO House — Art, Music & Creative Growth",
  description:
    "A house for growing curious minds. Children explore art, music, Open Studio, and creative growth together at PINO House.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body><CmsHydrator>{children}</CmsHydrator></body>
    </html>
  );
}
