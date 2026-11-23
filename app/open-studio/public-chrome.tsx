"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { PathFooter, PathHeader } from "../components/path-chrome";
import { useLocale } from "../localization";

export default function OpenStudioPublicChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { locale } = useLocale();
  const isPublicLanding = pathname === "/open-studio" || pathname === "/open-studio/";

  if (!isPublicLanding) return children;

  return (
    <div className="os-public-shell" data-pino-marketing-page>
      <PathHeader
        ariaLabel={locale === "vi" ? "Điều hướng Open Studio" : "Open Studio navigation"}
        activeHref="/open-studio"
        ctaHref="#sessions"
        ctaLabel={locale === "vi" ? "Xem lịch" : "View schedule"}
      />
      {children}
      <PathFooter/>
    </div>
  );
}
