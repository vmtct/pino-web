import type { Metadata } from "next";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Little Piner — PINO House",
  description: "Little hands. Big discoveries. Art and piano for children ages 3–6 at PINO House.",
};

const ASSET = "https://assets.pinohouse.art/site/littlePiner";
const SIGIL = "https://assets.pinohouse.art/core/Pino%20Sigil.png";
const asset = (name: string) => `${ASSET}/${encodeURIComponent(name)}`;

const learning = [
  ["Play", "Explore, wonder and make sense of the world.", "ChatGPT Image Aug 26, 2026, 08_53_07 AM (5).png"],
  ["Sense", "Feel, touch, hear and see with the whole body.", "ChatGPT Image Aug 26, 2026, 08_53_09 AM (6).png"],
  ["Repeat", "Build understanding and confidence through familiar rhythms.", "ChatGPT Image Aug 26, 2026, 08_53_11 AM (7).png"],
  ["Move", "Express, connect and stay joyful through movement.", "ChatGPT Image Aug 26, 2026, 08_53_14 AM (8).png"],
  ["Make", "Turn ideas into something real, tactile and meaningful.", "ChatGPT Image Aug 26, 2026, 08_53_16 AM (9).png"],
] as const;

const inside = [
  ["Warm & welcoming", "A cozy space that feels familiar, calm and inviting.", "ChatGPT Image Aug 26, 2026, 08_53_52 AM (1).png"],
  ["Art in every corner", "Natural materials and open-ended tools ready to explore.", "ChatGPT Image Aug 26, 2026, 08_53_53 AM (2).png"],
  ["Music up close", "A child-sized invitation to listen, touch and play.", "ChatGPT Image Aug 26, 2026, 08_53_54 AM (3).png"],
  ["Together & supported", "Small groups, caring teachers and gentle connection.", "ChatGPT Image Aug 26, 2026, 08_53_56 AM (4).png"],
  ["Safe & loved", "Soft routines and a space where little learners can settle in.", "ChatGPT Image Aug 26, 2026, 08_53_58 AM (5).png"],
] as const;

const growth = [
  ["Confidence", "Proud to try, choose and share.", "ChatGPT Image Aug 26, 2026, 08_54_00 AM (6).png"],
  ["Focus", "Staying with an experience a little longer each time.", "ChatGPT Image Aug 26, 2026, 08_54_02 AM (7).png"],
  ["Fine motor", "Small hands growing stronger and more skillful.", "ChatGPT Image Aug 26, 2026, 08_54_04 AM (8).png"],
  ["Listening", "Hearing carefully and responding with understanding.", "ChatGPT Image Aug 26, 2026, 08_54_06 AM (9).png"],
  ["Expression", "Finding a voice through art, music and play.", "ChatGPT Image Aug 26, 2026, 08_54_08 AM (10).png"],
] as const;

const gallery = [
  "ChatGPT Image Aug 26, 2026, 08_57_15 AM.png",
  "ChatGPT Image Aug 26, 2026, 08_57_24 AM.png",
  "ChatGPT Image Aug 26, 2026, 08_55_24 AM (3).png",
  "ChatGPT Image Aug 26, 2026, 08_55_26 AM (4).png",
  "ChatGPT Image Aug 26, 2026, 08_55_28 AM (5).png",
  "ChatGPT Image Aug 26, 2026, 08_55_30 AM (6).png",
] as const;

function Brand() {
  return (
    <a className={styles.brand} href="/" aria-label="PINO House home">
      <img src={SIGIL} alt="" />
      <span>PINO House</span>
    </a>
  );
}

export default function LittlePinerPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Brand />
        <nav className={styles.nav} aria-label="Little Piner navigation">
          <a href="/">House</a><a href="/#paths">Paths</a><a href="/open-studio">Open Studio</a><a href="#gallery">Stories</a><a href="/#about">About</a>
        </nav>
        <a className={styles.navCta} href="/open-studio">Open Studio <span>→</span></a>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Ages 3–6 · Little Piner</p>
          <h1>Little Piner</h1>
          <p className={styles.heroLead}>Little hands. Big discoveries.</p>
          <p className={styles.heroText}>A warm beginning for curious little hearts — growing creativity, confidence and joy through art and music.</p>
          <div className={styles.actions}>
            <a className={styles.primary} href="#paths">Explore Little Piner <span>→</span></a>
            <a className={styles.secondary} href="/open-studio">Visit the Studio <span>→</span></a>
          </div>
          <div className={styles.trust}><span>✦ Ages 3–6</span><span>❀ Playful learning</span><span>♡ Small groups</span><span>⌂ Safe & caring</span></div>
        </div>
        <div className={styles.heroImage}><img src={asset("ChatGPT Image Aug 26, 2026, 08_52_42 AM.png")} alt="Warm Little Piner art and piano studio" /></div>
      </section>

      <section className={styles.paths} id="paths">
        <div className={styles.centerLead}><span>✦</span><h2>Two ways to explore.</h2><p>One joyful journey.</p></div>
        <div className={styles.pathGrid}>
          <article className={styles.pathCard}>
            <div className={styles.pathImage}><img src={asset("ChatGPT Image Aug 26, 2026, 08_53_02 AM (2).png")} alt="Art with Little Piner" /></div>
            <div className={styles.pathCopy}><span className={`${styles.badge} ${styles.sage}`}>ART</span><h3>Art <em>with Little Piner</em></h3><strong>Vẽ · Nặn · Chạm · Làm</strong><p>Colors, shapes and materials become a gentle way to explore, focus and express.</p><a href="#gallery">Explore Art →</a></div>
          </article>
          <div className={styles.pathBridge}><img src={asset("ChatGPT Image Aug 26, 2026, 08_53_06 AM (4).png")} alt="" /><span>One little house.<br/>Many ways to grow.</span></div>
          <article className={`${styles.pathCard} ${styles.pathCardReverse}`}>
            <div className={styles.pathCopy}><span className={`${styles.badge} ${styles.terra}`}>PIANO</span><h3>Piano <em>with Little Piner</em></h3><strong>Nghe · Cảm · Chơi · Hiểu · Thể hiện</strong><p>Simple melodies invite children to listen, feel, play and respond with joy.</p><a href="#inside">Explore Piano →</a></div>
            <div className={styles.pathImage}><img src={asset("ChatGPT Image Aug 26, 2026, 08_53_04 AM (3).png")} alt="Piano with Little Piner" /></div>
          </article>
        </div>
      </section>

      <section className={styles.editorialSection}>
        <div className={styles.sectionLead}><h2>How little children learn</h2><span>♥</span><p>Young children learn best through play, connection and meaningful experience.</p><small>We guide. They discover.</small></div>
        <div className={styles.iconGrid}>{learning.map(([title, copy, image]) => <article className={styles.iconCard} key={title}><img src={asset(image)} alt="" loading="lazy"/><h3>{title}</h3><p>{copy}</p></article>)}</div>
      </section>

      <section className={styles.editorialSection} id="inside">
        <div className={styles.sectionLead}><h2>Inside Little Piner</h2><span>✦</span><p>A space designed for wonder, safety and beautiful beginnings.</p><a href="/open-studio">See our space →</a></div>
        <div className={styles.photoGrid}>{inside.map(([title, copy, image]) => <article className={styles.photoCard} key={title}><img src={asset(image)} alt="" loading="lazy"/><div><h3>{title}</h3><p>{copy}</p></div></article>)}</div>
      </section>

      <section className={`${styles.editorialSection} ${styles.growthSection}`}>
        <div className={styles.sectionLead}><h2>Growing together</h2><span>♥</span><p>Little by little, day by day, they grow in all the ways that matter most.</p></div>
        <div className={styles.iconGrid}>{growth.map(([title, copy, image]) => <article className={styles.iconCard} key={title}><img src={asset(image)} alt="" loading="lazy"/><h3>{title}</h3><p>{copy}</p></article>)}</div>
      </section>

      <section className={`${styles.editorialSection} ${styles.gallerySection}`} id="gallery">
        <div className={styles.sectionLead}><h2>Made by little hands</h2><span>✦</span><p>Small moments, proudly made.</p></div>
        <div><div className={styles.gallery}>{gallery.map((image, index) => <img key={image} src={asset(image)} alt={`Little Piner studio work ${index + 1}`} loading="lazy" />)}</div><p className={styles.galleryNote}>Every piece, every note, every smile is a step in their journey. ✦</p></div>
      </section>

      <section className={styles.cta}>
        <img src={asset("ChatGPT Image Aug 26, 2026, 08_55_32 AM (7).png")} alt="" loading="lazy" />
        <div><p>Step into the little house.</p><h2>Come visit Little Piner.</h2><span>See creativity, music and play in motion.</span><a href="/open-studio">Visit the Studio <b>→</b></a></div>
      </section>

      <footer className={styles.footer}>
        <div><Brand /><p>Art. Music. Creative Growth.</p><strong>pinohouse.art</strong></div>
        <div><h4>Explore</h4><a href="/">House</a><a href="/#paths">Paths</a><a href="/open-studio">Open Studio</a><a href="#gallery">Stories</a></div>
        <div><h4>About</h4><a href="/#about">Our Story</a><a href="/#about">The House</a><a href="/#about">Team</a><a href="/#about">Careers</a></div>
        <div><h4>Information</h4><a href="/open-studio">Visit</a><a href="/#about">FAQs</a><a href="/#about">Policies</a><a href="/#about">Contact</a></div>
        <div className={styles.stay}><h4>Stay connected</h4><p>Get news about Open Studio and special events.</p><span>Instagram · Facebook · YouTube</span></div>
        <small>© {new Date().getFullYear()} PINO House. All rights reserved.</small>
      </footer>

      <img className={styles.botanical} src={asset("ChatGPT Image Aug 26, 2026, 08_55_34 AM (8).png")} alt="" loading="lazy" />
      <img className={styles.motifs} src={asset("ChatGPT Image Aug 26, 2026, 08_55_34 AM (9).png")} alt="" loading="lazy" />
    </main>
  );
}
