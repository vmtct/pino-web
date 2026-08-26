const SIGIL = "https://assets.pinohouse.art/core/Pino%20Sigil.png";

type Locale = "en" | "vi";
type ChromeStyles = Record<string, string>;

const COPY = {
  en: {
    home: "House", paths: "Paths", studio: "Open Studio", stories: "Stories", about: "About",
    explore: "Explore", aboutHead: "About", info: "Information", ourStory: "Our Story",
    house: "The House", team: "Team", careers: "Careers", visit: "Visit", faqs: "FAQs",
    policies: "Policies", contact: "Contact", stay: "Stay connected",
    stayCopy: "Get news about Open Studio and special events.", tagline: "Art. Music. Creative Growth.",
    copyright: "All rights reserved.",
  },
  vi: {
    home: "Trang chủ", paths: "Lộ trình", studio: "Open Studio", stories: "Câu chuyện", about: "Về PINO",
    explore: "Khám phá", aboutHead: "Về PINO", info: "Thông tin", ourStory: "Câu chuyện PINO",
    house: "PINO House", team: "Đội ngũ", careers: "Tuyển dụng", visit: "Đến thăm", faqs: "Câu hỏi thường gặp",
    policies: "Chính sách", contact: "Liên hệ", stay: "Kết nối",
    stayCopy: "Nhận tin về Open Studio và các hoạt động đặc biệt.", tagline: "Nghệ thuật. Âm nhạc. Lớn lên sáng tạo.",
    copyright: "Đã đăng ký bản quyền.",
  },
} as const;

function cx(...values: Array<string | undefined>) { return values.filter(Boolean).join(" "); }

export function PathBrand({ styles, locale = "en" }: { styles: ChromeStyles; locale?: Locale }) {
  return <a className={styles.brand} href="/" aria-label={locale === "vi" ? "Trang chủ PINO House" : "PINO House home"}><img src={SIGIL} alt="" /><span>PINO House</span></a>;
}

export function PathHeader({ styles, locale = "en", ariaLabel, wrapperClassName, activeHref, activeClassName = "is-active", ctaHref = "/open-studio", ctaLabel = "Open Studio" }: { styles: ChromeStyles; locale?: Locale; ariaLabel: string; wrapperClassName?: string; activeHref?: string; activeClassName?: string; ctaHref?: string; ctaLabel?: string }) {
  const t = COPY[locale];
  const links = [["/", t.home], ["/#paths", t.paths], ["/open-studio", t.studio], ["/#stories", t.stories], ["/#about", t.about]] as const;
  const content = <><PathBrand styles={styles} locale={locale} /><nav className={styles.nav} aria-label={ariaLabel}>{links.map(([href, label]) => <a className={href === activeHref ? activeClassName : undefined} href={href} key={href}>{label}</a>)}</nav><a className={styles.navCta} href={ctaHref}>{ctaLabel} <span>→</span></a></>;
  if (wrapperClassName) return <header className={wrapperClassName} data-pino-path-header><div className={styles.header}>{content}</div></header>;
  return <header className={styles.header} data-pino-path-header>{content}</header>;
}

export function PathFooter({ styles, locale = "en", leadClassName, stayClassName }: { styles: ChromeStyles; locale?: Locale; leadClassName?: string; stayClassName?: string }) {
  const t = COPY[locale];
  return <footer className={styles.footer} data-pino-path-footer><div className={leadClassName}><PathBrand styles={styles} locale={locale} /><p>{t.tagline}</p><strong>pinohouse.art</strong></div><div><h4>{t.explore}</h4><a href="/">{t.home}</a><a href="/#paths">{t.paths}</a><a href="/open-studio">{t.studio}</a><a href="/#stories">{t.stories}</a></div><div><h4>{t.aboutHead}</h4><a href="/#about">{t.ourStory}</a><a href="/#about">{t.house}</a><a href="/#about">{t.team}</a><a href="/#about">{t.careers}</a></div><div><h4>{t.info}</h4><a href="/open-studio">{t.visit}</a><a href="/#about">{t.faqs}</a><a href="/#about">{t.policies}</a><a href="/#about">{t.contact}</a></div><div className={cx(styles.stay, stayClassName)}><h4>{t.stay}</h4><p>{t.stayCopy}</p><span>Instagram · Facebook · YouTube</span></div><small>© {new Date().getFullYear()} PINO House. {t.copyright}</small></footer>;
}
