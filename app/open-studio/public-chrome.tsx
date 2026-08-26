"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { PathFooter, PathHeader } from "../components/path-chrome";
import { useLocale } from "../localization";

const chromeStyles = {
  header: "os-public-nav os-shell",
  brand: "os-public-brand",
  nav: "os-public-nav-links",
  navCta: "os-public-top-cta",
  footer: "os-public-footer os-shell",
  stay: "os-public-footer-stay",
};

export default function OpenStudioPublicChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { locale } = useLocale();
  const isPublicLanding = pathname === "/open-studio" || pathname === "/open-studio/";

  if (!isPublicLanding) return children;

  return (
    <div className="os-public-shell">
      <PathHeader
        styles={chromeStyles}
        ariaLabel={locale === "vi" ? "Điều hướng Open Studio" : "Open Studio navigation"}
        wrapperClassName="os-public-header-wrap"
        activeHref="/open-studio"
        ctaHref="#sessions"
        ctaLabel={locale === "vi" ? "Xem lịch" : "View schedule"}
      />
      {children}
      <PathFooter
        styles={chromeStyles}
        leadClassName="os-public-footer-brand"
        stayClassName="os-public-footer-stay"
      />
    </div>
  );
}
