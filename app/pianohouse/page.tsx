import type { Metadata } from "next";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "PianoHouse — PINO House",
  description: "Music as expression. Confidence as they grow. Discover PianoHouse at PINO House.",
};

const ASSET = "https://assets.pinohouse.art/site/pianohouse";
const SIGIL = "https://assets.pinohouse.art/core/Pino%20Sigil.png";
const FOLIAGE_LEFT = "https://assets.pinohouse.art/site/Artchitect/botanical-leaf-illustration.png";
const FOLIAGE_RIGHT = "https://assets.pinohouse.art/site/Artchitect/neutral-botanical-abstract.png";

const collections = [
  ["Whimsical Worlds", "Playful pieces that spark curiosity and wonder.", "dreamlike-piano-under-starry-sky.png"],
  ["Film Stories", "Beloved themes from the movies that move us.", "glowing-film-strips-and-reel.png"],
  ["Piano Stories", "Original pieces that tell meaningful stories.", "grand-piano-in-sunlit-living-room.png"],
  ["Dreamscapes", "Gentle, expressive music for quiet moments and big imaginations.", "crescent-moon-above-clouds.png"],
] as const;

const journey = [
  ["1", "First Notes", "Discover the keyboard and the joy of sound.", "01-first-notes.svg"],
  ["2", "Melody", "Play with both hands and shape simple songs.", "02-melody.svg"],
  ["3", "Two Hands", "Build coordination and play with flow.", "03-two-hands.svg"],
  ["4", "Expression", "Bring music to life with feeling and color.", "04-expression.svg"],
  ["5", "Performance", "Share music with confidence and grace.", "05-performance.svg"],
] as const;

const lesson = [
  ["Welcome", "Connect, listen, and set the tone.", "piano-lesson-with-teacher.png", "♥"],
  ["Technique", "Build strong, beautiful fundamentals.", "hands-playing-piano-closeup.png", "♩"],
  ["Repertoire", "Learn pieces that inspire and challenge.", "sheet-music-on-piano.png", "♫"],
  ["Expression", "Explore dynamics, phrasing, and musical storytelling.", "girl-playing-piano-with-fairy-lights.png", "✦"],
  ["Reflection", "Look back, celebrate, and set new goals.", "girl-drawing-at-sunlit-desk.png", "◒"],
] as const;

const moments = [
  ["Student Recitals", "girl-perform.png"],
  ["Masterclasses", "girl-with-teacher.png"],
  ["Concert Experiences", "stage.png"],
  ["Certificates & Milestones", "girl-with-friends.png"],
  ["PINO House Moments", "girl-play-piano-mid.png"],
] as const;

function Brand() {
  return (
    <a className={styles.brand} href="/" aria-label="PINO House home">
      <img src={SIGIL} alt="" />
      <span>PINO House</span>
    </a>
  );
}

export default function PianoHousePage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Brand />
        <nav className={styles.nav} aria-label="PianoHouse navigation">
          <a href="/">House</a><a href="/#paths">Paths</a><a href="/open-studio">Open Studio</a><a href="/#stories">Stories</a><a href="/#about">About</a>
        </nav>
        <a className={styles.navCta} href="/open-studio">Explore Open Studio <span>→</span></a>
      </header>

      <section className={styles.hero}>
        <img className={styles.heroFoliage} src={FOLIAGE_LEFT} alt="" />
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>PINO House · Music</p>
          <h1>PianoHouse</h1>
          <p className={styles.heroLead}>Music as expression. Confidence as they grow.</p>
          <p className={styles.heroText}>At PINO House, children discover the stories in music, learn to express themselves at the piano, and step into the moments that stay with them.</p>
          <div className={styles.actions}>
            <a className={styles.primary} href="#journey">Explore PianoHouse <span>→</span></a>
            <a className={styles.secondary} href="/open-studio">Try a Lesson <span>→</span></a>
          </div>
        </div>
        <div className={styles.heroImage}><img src={`${ASSET}/girl-playing-grand-piano-at-home.png`} alt="Young pianist at a grand piano in a warm PianoHouse room" /></div>
      </section>

      <section className={styles.contentSection} id="collections">
        <div className={styles.sectionLead}>
          <h2>What children play <span>✦</span></h2>
          <p>Curated collections that open imagination and invite children into beautiful musical worlds.</p>
          <a href="#collections">Explore all collections <span>→</span></a>
        </div>
        <div className={styles.collectionGrid}>
          {collections.map(([title, copy, image]) => (
            <article className={styles.collectionCard} key={title}>
              <img src={`${ASSET}/${image}`} alt="" />
              <div><h3>{title}</h3><p>{copy}</p><a href="#journey">Explore {title} <span>→</span></a></div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.journeySection} id="journey">
        <div className={styles.sectionLead}>
          <h2>How the journey grows <span>✦</span></h2>
          <p>A thoughtful progression that builds musicianship, expression, and confidence.</p>
        </div>
        <div className={styles.journeyGrid}>
          {journey.map(([number, title, copy, icon]) => (
            <article className={styles.journeyStep} key={title}>
              <div className={styles.iconWrap}><img src={`${ASSET}/${icon}`} alt="" /></div>
              <strong>{number}</strong><h3>{title}</h3><p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.contentSection} id="lesson">
        <div className={styles.sectionLead}>
          <h2>Inside a lesson <span>✦</span></h2>
          <p>A warm structure that nurtures skill, creativity, and self-expression.</p>
          <a href="#journey">Learn more about our approach <span>→</span></a>
        </div>
        <div className={styles.lessonGrid}>
          {lesson.map(([title, copy, image, mark]) => (
            <article className={styles.lessonCard} key={title}>
              <img src={`${ASSET}/${image}`} alt="" />
              <div><h3><span>{mark}</span>{title}</h3><p>{copy}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.contentSection} id="moments">
        <div className={styles.sectionLead}>
          <h2>Performance & moments <span>✦</span></h2>
          <p>Real stages. Warm audiences. Memories that last a lifetime.</p>
          <a href="/open-studio">See upcoming events <span>→</span></a>
        </div>
        <div className={styles.momentsGrid}>
          {moments.map(([title, image]) => (
            <article className={styles.momentCard} key={title}><img src={`${ASSET}/${image}`} alt="" /><h3>{title}</h3></article>
          ))}
        </div>
      </section>

      <section className={styles.cta}>
        <img className={styles.ctaBg} src={`${ASSET}/front-door.png`} alt="Warm illuminated entrance to PianoHouse" />
        <div className={styles.ctaShade} />
        <img className={styles.ctaFoliage} src={FOLIAGE_RIGHT} alt="" />
        <div className={styles.ctaCopy}>
          <div><h2>Begin the PianoHouse journey</h2><p>Book a trial lesson or explore Open Studio and find the right beginning for your child.</p></div>
          <div className={styles.ctaActions}><a className={styles.ctaPrimary} href="/open-studio">Try a Lesson <span>→</span></a><a href="#journey">Explore PianoHouse <span>→</span></a><a href="/open-studio">Explore Open Studio <span>→</span></a></div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div><Brand /><p>Art. Music. Creative Growth.</p><strong>pinohouse.art</strong></div>
        <div><h4>Explore</h4><a href="/">House</a><a href="/#paths">Paths</a><a href="/open-studio">Open Studio</a><a href="/#stories">Stories</a></div>
        <div><h4>About</h4><a href="/#about">Our Story</a><a href="/#about">The House</a><a href="/#about">Team</a><a href="/#about">Careers</a></div>
        <div><h4>Information</h4><a href="/open-studio">Visit</a><a href="/#about">FAQs</a><a href="/#about">Policies</a><a href="/#about">Contact</a></div>
        <div className={styles.stay}><h4>Stay connected</h4><p>Get news about Open Studio and special events.</p><span>Instagram · Facebook · YouTube</span></div>
        <small>© {new Date().getFullYear()} PINO House. All rights reserved.</small>
      </footer>
      <img className={styles.footerFoliage} src={FOLIAGE_RIGHT} alt="" />
    </main>
  );
}
