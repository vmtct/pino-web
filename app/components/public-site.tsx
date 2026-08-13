import type { ReactNode } from "react";

export function BrandMark({ href = "/" }: { href?: string }) {
  return <a className="wordmark" href={href} aria-label="PINO House — trang chủ">PINO<span>•</span></a>;
}

export function PublicNav() {
  return (
    <header className="site-header" id="top">
      <nav className="nav shell" aria-label="Điều hướng chính">
        <BrandMark href="#top" />
        <div className="nav-links">
          <a href="#why-pino">Vì sao PINO</a>
          <a href="#paths">Bốn lộ trình</a>
          <a href="#journey">Premium Journey</a>
        </div>
        <a className="nav-cta" href="/open-studio">Khám phá Open Studio</a>
      </nav>
    </header>
  );
}

export function SectionIntro({ eyebrow, title, copy, id }: { eyebrow: string; title: ReactNode; copy?: string; id?: string }) {
  return (
    <div className="hp-section-intro">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 id={id}>{title}</h2>
      </div>
      {copy ? <p>{copy}</p> : null}
    </div>
  );
}

export function PrimaryCta({ children = "Khám phá Open Studio", href = "/open-studio" }: { children?: ReactNode; href?: string }) {
  return <a className="button button-dark" href={href}>{children}<span aria-hidden="true">→</span></a>;
}

export function HouseArtwork({ compact = false }: { compact?: boolean }) {
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
      <div><BrandMark /><p className="footer-note">Một ngôi nhà sáng tạo cho trẻ em.</p></div>
      <div className="footer-links" aria-label="Liên kết cuối trang">
        <a href="#paths">Bốn lộ trình</a>
        <a href="#journey">Premium Journey</a>
        <a href="/open-studio">Open Studio</a>
      </div>
      <span>© {new Date().getFullYear()} PINO House</span>
    </footer>
  );
}
