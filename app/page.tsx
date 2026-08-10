const paths = [
  { name: "Art", detail: "See, make, shape" },
  { name: "Piano", detail: "Listen, play, express" },
  { name: "English", detail: "Explore, speak, connect" },
  { name: "Open Studio", detail: "Drop in and discover" },
];

export default function Home() {
  return (
    <main>
      <nav className="nav shell">
        <a className="wordmark" href="#top" aria-label="PINO home">
          PINO<span>•</span>
        </a>
        <div className="nav-links">
          <a href="#open-studio">Open Studio</a>
          <a href="#paths">Paths</a>
          <a href="#membership">Membership</a>
        </div>
        <a className="nav-cta" href="#open-studio">Try PINO</a>
      </nav>

      <section className="hero shell" id="top">
        <div className="hero-copy">
          <p className="eyebrow">PINO CREATIVE CLUB</p>
          <h1>A place to make<br /><em>something of your own.</em></h1>
          <p className="hero-lede">
            Art, music and creative exploration for curious kids. Start with an
            Open Studio pass, find what clicks, then keep going your way.
          </p>
          <div className="hero-actions">
            <a className="button button-dark" href="#open-studio">Get your first pass</a>
            <a className="text-link" href="#membership">See how PINO works <span>→</span></a>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orb orb-a" />
          <div className="orb orb-b" />
          <div className="orb orb-c" />
          <div className="art-note">MAKE<br />MORE<br /><strong>YOU.</strong></div>
          <div className="scribble">✳</div>
        </div>
      </section>

      <section className="statement">
        <div className="shell statement-inner">
          <p className="eyebrow">NOT ANOTHER AFTER-SCHOOL CLASS</p>
          <h2>Come curious.<br /><em>Leave with a little more of yourself.</em></h2>
          <p>
            PINO is a creative club built around doing, not just being taught.
            Kids can move between paths, try something new and build confidence
            through small wins.
          </p>
        </div>
      </section>

      <section className="paths shell" id="paths">
        <div className="section-heading">
          <div>
            <p className="eyebrow">FOUR WAYS IN</p>
            <h2>Find your thing.</h2>
          </div>
          <p>There is no single right way to be creative.</p>
        </div>
        <div className="path-grid">
          {paths.map((path, index) => (
            <article className={`path-card path-${index + 1}`} key={path.name}>
              <span className="path-index">0{index + 1}</span>
              <h3>{path.name}</h3>
              <p>{path.detail}</p>
              <span className="path-arrow">↗</span>
            </article>
          ))}
        </div>
      </section>

      <section className="open-studio" id="open-studio">
        <div className="shell open-studio-inner">
          <div>
            <p className="eyebrow">OPEN STUDIO</p>
            <h2>Don&apos;t choose a path yet.<br /><em>Just come play.</em></h2>
            <p>
              Your first step into PINO is simple: use a free pass to explore an
              Open Studio session and see what feels right.
            </p>
            <a className="button button-light" href="mailto:hello@pino.house?subject=My%20first%20PINO%20pass">Get my first pass</a>
          </div>
          <div className="pass-card">
            <span>FREE</span>
            <strong>4</strong>
            <p>passes / month</p>
            <div className="pass-list">
              <span>01 · Art</span>
              <span>02 · Piano</span>
              <span>03 · English</span>
              <span>04 · Bring a friend</span>
            </div>
          </div>
        </div>
      </section>

      <section className="membership shell" id="membership">
        <div className="section-heading">
          <div>
            <p className="eyebrow">MEMBERSHIP</p>
            <h2>Start free.<br /><em>Stay for what matters.</em></h2>
          </div>
          <p>Try the club first. Upgrade when PINO becomes part of your rhythm.</p>
        </div>
        <div className="membership-grid">
          <article className="membership-card">
            <p className="eyebrow">FREE</p>
            <h3>Explore</h3>
            <p>Four Open Studio passes every month, including one Bring-a-Friend pass.</p>
            <span>₫0</span>
          </article>
          <article className="membership-card premium">
            <p className="eyebrow">PREMIUM</p>
            <h3>Go deeper</h3>
            <p>Full access to the PINO experience, with a 14-day Premium trial to start.</p>
            <span>Premium</span>
          </article>
        </div>
      </section>

      <footer className="footer shell">
        <div className="wordmark">PINO<span>•</span></div>
        <p>Creative club for curious kids.</p>
        <span>© {new Date().getFullYear()} PINO</span>
      </footer>
    </main>
  );
}
