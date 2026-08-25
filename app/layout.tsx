import type { Metadata } from "next";
import "./globals.css";
import CmsHydrator from "./cms-hydrator";

const PINO_LOGO = "https://assets.pinohouse.art/core/Pino%20Logo.png";

export const metadata: Metadata = {
  title: "PINO House — Art, Music & Creative Growth",
  description:
    "A house for growing curious minds. Children explore art, music, Open Studio, and creative growth together at PINO House.",
  icons: {
    icon: [{ url: PINO_LOGO, type: "image/png" }],
    shortcut: PINO_LOGO,
    apple: PINO_LOGO,
  },
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
