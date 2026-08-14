"use client";

import type { ReactNode } from "react";
import { CmsText, useCmsImage } from "../cms-hydrator";

export function BrandMark({ href = "/" }: { href?: string }) {
  return <a className="wordmark" href={href} aria-label="PINO House — trang chủ">PINO<span>•</span></a>;
}

export function PublicNav() {
  return (
    <header className="site-header" id="top">
      <nav className="nav shell" aria-label="Điều hướng chính">
        <BrandMark href="#top" />
        <div className="nav-links">
          <a href="#why-pino"><CmsText contentKey="site_nav_why_pino" fallback="Vì sao PINO" /></a>
          <a href="#paths"><CmsText contentKey="site_nav_paths" fallback="Bốn lộ trình" /></a>
          <a href="#journey"><CmsText contentKey="site_nav_premium" fallback="Premium Journey" /></a>
        </div>
        <a className="nav-cta" href="/open-studio"><CmsText contentKey="site_nav_open_studio" fallback="Khám phá Open Studio" /></a>
      </nav>
    </header>
  );
}

export function SectionIntro({ eyebrow, title, copy, id, eyebrowKey, copyKey }: { eyebrow: string; title: ReactNode; copy?: string; id?: string; eyebrowKey?: string; copyKey?: string }) {
  return (
    <div className="hp-section-intro">
      <div>
        <p className="eyebrow">{eyebrowKey ? <CmsText contentKey={eyebrowKey} fallback={eyebrow} /> : eyebrow}</p>
        <h2 id={id}>{title}</h2>
      </div>
      {copy ? <p>{copyKey ? <CmsText contentKey={copyKey} fallback={copy} /> : copy}</p> : null}
    </div>
  );
}

export function PrimaryCta({ children = "Khám phá Open Studio", href = "/open-studio", contentKey = "site_primary_cta" }: { children?: ReactNode; href?: string; contentKey?: string }) {
  const label = typeof children === "string" ? <CmsText contentKey={contentKey} fallback={children} /> : children;
  return <a className="button button-dark" href={href}>{label}<span aria-hidden="true">→</span></a>;
}

export function HouseArtwork({ compact = false, assetKey }: { compact?: boolean; assetKey?: string }) {
  const image = useCmsImage(assetKey);
  if (image) return <div className={`house-art house-art-image${compact ? " house-art-compact" : ""}`}><img src={image.url} alt={image.alt} /></div>;
  return (
    <div className={`house-art${compact ? " house-art-compact" : ""}`} aria-hidden="true">
      <span className="house-shape house-shape-coral" />
      <span className="house-shape house-shape-blue" />
      <span className="house-shape house-shape-lime" />
      <span className="house-line" />
      <span className="house-note">MAKE<br />ROOM<br /><strong>TO GROW.</strong></span>
      <span className="house-spark">✳</span>
    </div>
  );
}

export function PublicFooter() {
  return (
    <footer className="footer shell">
      <div><BrandMark /><p className="footer-note"><CmsText contentKey="site_footer_note" fallback="Một ngôi nhà sáng tạo cho trẻ em." /></p></div>
      <div className="footer-links" aria-label="Liên kết cuối trang">
        <a href="#paths"><CmsText contentKey="site_nav_paths" fallback="Bốn lộ trình" /></a>
        <a href="#journey"><CmsText contentKey="site_nav_premium" fallback="Premium Journey" /></a>
        <a href="/open-studio"><CmsText contentKey="site_footer_open_studio" fallback="Open Studio" /></a>
      </div>
      <span>© {new Date().getFullYear()} PINO House</span>
    </footer>
  );
}
