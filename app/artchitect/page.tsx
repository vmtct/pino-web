import type { CSSProperties } from "react";
import type { Metadata } from "next";
import styles from "./page.module.css";
import { PathFooter, PathHeader } from "../components/path-chrome";

export const metadata: Metadata = {
  title: "Artchitect — PINO House",
  description: "Observe. Make. Design. Build. Discover Artchitect at PINO House.",
};

const ASSET = "https://assets.pinohouse.art/site/Artchitect";

const journey = [
  ["Line", "We begin by observing closely and drawing with intention.", "artchitect-journey-01-line.png"],
  ["Form", "We explore shape and structure with our hands and materials.", "artchitect-journey-02-form.png"],
  ["Light", "We explore light, shadow, and atmosphere to reveal mood.", "artchitect-journey-03-light.png"],
  ["Color", "We discover harmony, contrast, and the feeling color can hold.", "artchitect-journey-04-color.png"],
  ["Composition", "We arrange, balance, and design with purpose.", "artchitect-journey-05-composition.png"],
  ["Story", "We bring it all together to tell stories that matter.", "artchitect-journey-06-story.png"],
] as const;

const process = [
  ["Observe & draw", "We build seeing skills through sketching, studies, and wondering about the world.", "0%"],
  ["Explore & experiment", "We try new materials and techniques, and learn through play and discovery.", "25%"],
  ["Make & build", "We shape ideas in three dimensions, from maquettes to expressive sculptures.", "50%"],
  ["Imagine & create", "We develop our voice through original artworks and visual storytelling.", "75%"],
  ["Reflect & share", "We celebrate progress and learn from each other’s tools and ideas.", "100%"],
] as const;

const projects = [
  ["Character studies", "Expressive drawings that explore personality, pose, and emotion.", "character-design-sketchbook.png"],
  ["Observational painting", "Learning to see color, value, and form in the world around us.", "classic-still-life-painting.png"],
  ["Models & maquettes", "Design, build, and problem-solve with scale, structure, and detail.", "architectural-model-workshop.png"],
  ["Illustration & narrative", "Visual storytelling that connects imagination with meaning.", "coastal-village-watercolor.png"],
  ["Compositions & studies", "Exploring layout, pattern, and visual rhythm across mediums.", "blue-architecture-concept-board.png"],
] as const;

const gallery = [
  "cathedral-perspective-drawing.png",
  "young-woman-painted-portrait.png",
  "bird-color-study.png",
  "watercolor-painting-closeup.png",
  "classical-sculpture-bust.png",
  "mountain-landscape-sketchbook.png",
  "oil-paint-sticks-and-palette.png",
];

export default function ArtchitectPage() {
  return (
    <main className={styles.page}>
      <PathHeader styles={styles} ariaLabel="Artchitect navigation" />

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <h1>Artchitect</h1>
          <p className={styles.heroLead}>Observe. Make. Design. Build.</p>
          <p className={styles.heroText}>We shape the way children see and build the visual world.</p>
          <div className={styles.actions}>
            <a className={styles.primary} href="#journey">Explore Artchitect <span>→</span></a>
            <a className={styles.secondary} href="/open-studio">Visit the Studio <span>→</span></a>
          </div>
        </div>
        <div className={styles.heroImage}><img src={`${ASSET}/artist-studio-workspace.png`} alt="Warm Artchitect studio workspace" /></div>
      </section>

      <section className={styles.section} id="journey">
        <div className={styles.sectionLead}><h2>The Artchitect Journey</h2><span>✦</span><p>A way of seeing. A way of making.<br/>A way of shaping stories in the world.</p></div>
        <div className={styles.journeyGrid}>
          {journey.map(([title, copy, image], i) => (
            <article className={styles.journeyCard} key={title}>
              <img src={`${ASSET}/${image}`} alt=""/>
              <h3>{title}</h3><p>{copy}</p>
              {i < journey.length - 1 ? <span className={styles.arrow}>→</span> : null}
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionLead}><h2>Inside the studio</h2><span>✦</span><p>How we learn and grow together.</p><a href="#projects">Our approach →</a></div>
        <div className={styles.cardGrid}>
          {process.map(([title, copy, pos], i) => {
            const cropStyle = {
              backgroundImage: `url(${ASSET}/creative-process-photo-strip.png)`,
              backgroundPosition: `${pos} center`,
            } as CSSProperties;
            return (
              <article className={`${styles.featureCard} ${i === process.length - 1 ? styles.mobileOrphan : ""}`} key={title}>
                <div className={styles.processCrop} style={cropStyle} aria-hidden="true" />
                <h3>{title}</h3><p>{copy}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.section} id="projects">
        <div className={styles.sectionLead}><h2>Projects & outcomes</h2><p>From ideas to meaningful work that leaves a mark.</p><a href="#gallery">See student stories →</a></div>
        <div className={styles.cardGrid}>
          {projects.map(([title, copy, image], i) => (
            <article className={`${styles.featureCard} ${i === projects.length - 1 ? styles.mobileOrphan : ""}`} key={title}>
              <img src={`${ASSET}/${image}`} alt=""/><h3>{title}</h3><p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={`${styles.section} ${styles.gallerySection}`} id="gallery">
        <div className={styles.sectionLead}><h2>Made in the studio</h2><span>✦</span></div>
        <div className={styles.gallery}>
          {gallery.map((image, i) => <img className={i === gallery.length - 1 ? styles.galleryOrphan : ""} key={image} src={`${ASSET}/${image}`} alt="Artchitect studio work" />)}
        </div>
      </section>

      <section className={styles.cta}>
        <img src={`${ASSET}/rust-blue-painted-texture-banner.png`} alt=""/>
        <div><h2>Come visit Artchitect.</h2><p>Step into the studio and see creativity in action.</p><a href="/open-studio">Visit the Studio <span>→</span></a></div>
      </section>

      <PathFooter styles={styles} leadClassName={styles.footerWide} stayClassName={styles.footerWide} />
      <img className={styles.botanicalLeft} src={`${ASSET}/botanical-leaf-illustration.png`} alt=""/>
      <img className={styles.botanicalRight} src={`${ASSET}/neutral-botanical-abstract.png`} alt=""/>
    </main>
  );
}
