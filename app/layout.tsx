import type { Metadata } from "next";
import { Noto_Serif } from "next/font/google";
import "./globals.css";
import "./homepage-mobile.css";
import "./localization.css";
import "./public-consistency.css";
import "./public-enhancements.css";
import CmsHydrator from "./cms-hydrator";
import { LocaleProvider } from "./localization";
import PublicEnhancements from "./public-enhancements";

const notoSerif = Noto_Serif({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-display-vi",
});

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
    <html lang="vi" suppressHydrationWarning className={notoSerif.variable}>
      <body><LocaleProvider><CmsHydrator>{children}</CmsHydrator><PublicEnhancements /></LocaleProvider></body>
    </html>
  );
}
