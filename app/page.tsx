import styles from "./homepage.module.css";

const ASSET = "https://assets.pinohouse.art/site/homepage";
const SIGIL = "https://assets.pinohouse.art/core/Pino%20Sigil.png";

const paths = [
  {
    name: "PianoHouse",
    copy: "Music as expression. Confidence as harmony.",
    image: "hands-playing-piano-top-view.png",
    href: "/open-studio",
  },
  {
    name: "Artchitect",
    copy: "Think. Design. Create. Build your own world.",
    image: "bright-art-classroom.png",
    href: "/artchitect",
  },
  {
    name: "Little Piner",
    copy: "Play, wonder, and grow — at their own beautiful pace.",
    image: "open-plan-creative-studio.png",
    href: "/open-studio",
  },
] as const;

const steps = [
  {
    title: "Discover",
    copy: "Spark curiosity and explore what lights them up.",
    image: "autumn-leaves-round-icon.png",
  },
  {
    title: "Visit",
    copy: "Step into the House — virtually or in person.",
    image: "studio-house-entrance-round-icon.png",
  },
  {
    title: "Find your path",
    copy: "We’ll help your child find their way.",
    image: "direction-signpost-round-icon.png",
  },
  {
    title: "Grow",
    copy: "Skill, confidence, and creativity that last.",
    image: "potted-sprout-round-icon.png",
  },
] as const;

const madeAtPino = [
  "child-painting-at-easel.png",
  "child-playing-piano-top-view.png",
  "child-pottery-lesson-closeup.png",
  "child-painting-at-studio-table.png",
  "moonlit-village-painting.png",
  "child-painting-botanical-watercolor-closeup.png",
] as const;

const houseGallery = [
  "creative-studio-entrance-hall.png",
  "cozy-creative-studio-lounge.png",
  "grand-piano-in-creative-studio.png",
  "children-group-art-class.png",
] as const;

function Brand() {
  return (
    <a className={styles.brand} href="#top" aria-label="PINO House home">
      <img src={SIGIL} alt="" />
      <span>PINO House</span>
    </a>
  );
}

export default function Home() {
  return (
    <main className={styles.page} id="top">
      <div className={styles.shell}>
        <header className={styles.header}>
          <Brand />
          <nav className={styles.nav} aria-label="Primary navigation">
            <a href="#house">House</a>
            <a href="#paths">Paths</a>
            <a href="/open-studio">Open Studio</a>
            <a href="#stories">Stories</a>
            <a href="#about">About</a>
          </nav>
          <a className={styles.navCta} href="/open-studio">
            <span className={styles.ctaLabel}>Open Studio</span>
            <span className={styles.arrowCircle} aria-hidden="true">→</span>
          </a>
        </header>

        <section className={styles.hero} aria-labelledby="home-title">
          <div className={styles.heroCopy}>
            <h1 id="home-title">A house for<br />growing curious<br />minds.</h1>
            <p>Where children explore art, music, and creative growth — together.</p>
            <div className={styles.heroActions}>
              <a className={styles.primary} href="/open-studio">Open Studio <span aria-hidden="true">→</span></a>
              <a className={styles.secondary} href="#house">Explore the House</a>
            </div>
          </div>

          <div className={styles.heroVisual} aria-label="Illustrated PINO House courtyard">
            <span className={styles.heroHalo} aria-hidden="true" />
            <img
              className={styles.heroCampus}
              src={`${ASSET}/creative-campus-courtyard-illustration.png`}
              alt="PINO House creative campus courtyard"
              loading="eager"
            />
          </div>

          <img
            className={styles.heroLeaves}
            src={`${ASSET}/glowing-autumn-leaves.png`}
            alt=""
            aria-hidden="true"
          />
        </section>

        <section className={styles.section} id="paths" aria-labelledby="paths-title">
          <div className={styles.withIntro}>
            <div className={styles.intro}>
              <h2 id="paths-title">Inside the House</h2>
              <div className={styles.sparkline}><span>✦</span></div>
              <p>Three paths. One welcoming home. Each corner of PINO is designed for children to explore, express, and grow with confidence.</p>
              <a className={styles.textLink} href="#house">Learn more about our paths <span>→</span></a>
            </div>

            <div className={styles.pathGrid}>
              {paths.map((path) => (
                <article className={styles.pathCard} key={path.name}>
                  <img className={styles.cardImage} src={`${ASSET}/${path.image}`} alt="" />
                  <div className={styles.cardCopy}>
                    <h3>{path.name}</h3>
                    <p>{path.copy}</p>
                    <a href={path.href}>Explore {path.name} <span aria-hidden="true">→</span></a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="open-title">
          <div className={styles.openStudio}>
            <div className={styles.openLead}>
              <h2 id="open-title">Open Studio</h2>
              <p>This week’s discovery</p>
              <h3>Watercolor Stories</h3>
              <p>Paint your imagination. Explore color, texture, and story through watercolor.</p>
              <a className={styles.textLink} href="/open-studio">See all Open Studio sessions <span>→</span></a>
            </div>

            <div className={styles.openGrid}>
              <a className={styles.openFeature} href="/open-studio" aria-label="Explore Watercolor Stories">
                <img src={`${ASSET}/watercolor-palette-and-floral-art.png`} alt="Watercolor palette and botanical painting" />
              </a>
              <article className={styles.openCard}>
                <span className={styles.badge}>WEEKLY</span>
                <img src={`${ASSET}/child-playing-piano-top-view.png`} alt="Child exploring piano" />
                <div className={styles.openCardBody}>
                  <h3>Tiny Composers</h3>
                  <p>Create a melody. Play, listen, and discover.</p>
                </div>
              </article>
              <article className={styles.openCard}>
                <span className={styles.badge}>WEEKLY</span>
                <img src={`${ASSET}/child-pottery-lesson-closeup.png`} alt="Hands shaping clay together" />
                <div className={styles.openCardBody}>
                  <h3>Clay Wonders</h3>
                  <p>Shape. Build. Play. Make something with your hands.</p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className={styles.how} aria-labelledby="how-title">
          <div className={styles.howGrid}>
            <h2 className={styles.howTitle} id="how-title">How PINO works</h2>
            {steps.map((step) => (
              <article className={styles.step} key={step.title}>
                <img src={`${ASSET}/${step.image}`} alt="" />
                <div>
                  <strong>{step.title}</strong>
                  <p>{step.copy}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section} id="stories" aria-labelledby="stories-title">
          <div className={styles.withIntro}>
            <div className={styles.intro}>
              <h2 id="stories-title">Made at PINO</h2>
              <p>Every creation tells a story. Here’s a glimpse of what our students make, imagine, and explore.</p>
              <a className={styles.textLink} href="#stories">View gallery <span>→</span></a>
            </div>
            <div className={styles.galleryRow}>
              {madeAtPino.map((image, index) => (
                <img key={image} src={`${ASSET}/${image}`} alt={`PINO creative moment ${index + 1}`} loading="lazy" />
              ))}
            </div>
          </div>
        </section>

        <section className={styles.section} id="house" aria-labelledby="house-title">
          <div className={styles.withIntro}>
            <div className={styles.intro}>
              <h2 id="house-title">The House</h2>
              <p>A warm and inspiring space in the heart of the community. Designed for imagination and connection.</p>
              <a className={styles.textLink} href="#about">Take a look inside <span>→</span></a>
            </div>
            <div className={styles.houseRow}>
              {houseGallery.map((image, index) => (
                <img key={image} src={`${ASSET}/${image}`} alt={`Inside PINO House ${index + 1}`} loading="lazy" />
              ))}
            </div>
          </div>
        </section>

        <section className={styles.ctaWrap} aria-label="Visit PINO House">
          <div className={styles.cta}>
            <img src={`${ASSET}/garden-archway-coral-banner.png`} alt="" aria-hidden="true" />
            <span className={styles.ctaOverlay} aria-hidden="true" />
            <div className={styles.ctaContent}>
              <h2>Come experience the House.</h2>
              <p>Open Studio is the perfect place to start.</p>
              <a href="/open-studio">Open Studio <span aria-hidden="true">→</span></a>
            </div>
          </div>
        </section>

        <footer className={styles.footer} id="about">
          <div className={styles.footerLead}>
            <a className={styles.footerBrand} href="#top">
              <img src={SIGIL} alt="" />
              <span>PINO House</span>
            </a>
            <p>Art. Music. Creative Growth.</p>
            <strong>pinohouse.art</strong>
          </div>

          <div className={styles.footerCol}>
            <h4>Explore</h4>
            <a href="#house">House</a>
            <a href="#paths">Paths</a>
            <a href="/open-studio">Open Studio</a>
            <a href="#stories">Stories</a>
          </div>

          <div className={styles.footerCol}>
            <h4>About</h4>
            <a href="#about">Our Story</a>
            <a href="#house">The House</a>
            <a href="#about">Team</a>
            <a href="#about">Careers</a>
          </div>

          <div className={styles.footerCol}>
            <h4>Information</h4>
            <a href="/open-studio">Visit</a>
            <a href="#about">FAQs</a>
            <a href="#about">Policies</a>
            <a href="#about">Contact</a>
          </div>

          <div className={styles.news}>
            <h4>Stay connected</h4>
            <p>Get news about Open Studio and special events.</p>
            <div className={styles.emailMock} aria-label="Newsletter coming soon">
              <span>Your email</span><span>→</span>
            </div>
            <div className={styles.socials} aria-hidden="true">◎ f ▶</div>
          </div>

          <small className={styles.copyright}>© {new Date().getFullYear()} PINO House. All rights reserved.</small>
          <img className={styles.footerLeaves} src={`${ASSET}/glowing-autumn-leaves.png`} alt="" aria-hidden="true" />
        </footer>
      </div>
    </main>
  );
}
