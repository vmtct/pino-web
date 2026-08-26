import type { Metadata } from "next";
import "./globals.css";
import "./homepage-mobile.css";
import "./localization.css";
import CmsHydrator from "./cms-hydrator";
import { LocaleProvider } from "./localization";

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
    <html lang="vi" suppressHydrationWarning>
      <body><LocaleProvider><CmsHydrator>{children}</CmsHydrator></LocaleProvider></body>
    </html>
  );
}
