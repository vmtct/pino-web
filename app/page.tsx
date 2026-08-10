const paths = [
  { name: "Art", detail: "See, make, shape" },
  { name: "Piano", detail: "Listen, play, express" },
];

const ageStages = [
  { age: "3–6", title: "Little Piner", detail: "A first creative world where Art and Piano meet through play, rhythm and discovery." },
  { age: "7+", title: "PINO", detail: "More depth, more choice, and a clearer path to grow in Art or Piano." },
];

const steps = [
  { number: "01", title: "Pick a day", detail: "Choose an Open Studio session that fits your family." },
  { number: "02", title: "Come to PINO", detail: "No preparation. No need to choose Art or Piano first." },
  { number: "03", title: "Make something", detail: "Try, make, play and see what naturally clicks." },
  { number: "04", title: "Come back", detail: "Use another pass when they are ready to keep going." },
];

export default function Home() {
  return (
    <main>
      <nav className="nav shell" id="top">
        <a className="wordmark" href="#top" aria-label="PINO home">
          PINO<span>•</span>
        </a>
        <div className="nav-links">
          <a href="#open-studio">Open Studio</a>
          <a href="#paths">Art & Piano</a>
          <a href="#membership">Membership</a>
        </div>
        <a className="nav-cta" href="#open-studio">Get a Free Pass</a>
      </nav>

      <section className="hero shell">
        <div className="hero-copy">
          <p className="eyebrow">PINO OPEN STUDIO · AGES 3–15</p>
          <h1>Cho con một<br />buổi chiều <em>thật ý nghĩa.</em></h1>
          <p className="hero-lede">
            Một buổi chiều để con thử Art và Piano — không cần chọn trước.
            Bắt đầu với một Open Studio pass miễn phí và xem điều gì thật sự chạm đến con.
          </p>
          <div className="hero-actions">
            <a className="button button-dark" href="#open-studio">Get their first pass</a>
            <a className="text-link" href="#how-it-works">See how it works <span>→</span></a>
          </div>
          <div className="hero-proof">
            <span>ART</span><i>·</i><span>PIANO</span><i>·</i><span>OPEN STUDIO</span>
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
            Kids can move between Art and Piano, try something new and build
            confidence through small wins.
          </p>
        </div>
      </section>

      <section className="paths shell" id="paths">
        <div className="section-heading">
          <div>
            <p className="eyebrow">TWO WAYS TO CREATE</p>
            <h2>Find their thing.</h2>
          </div>
          <p>Two core disciplines. One creative home. Open Studio is the easiest place to begin.</p>
        </div>
        <div className="path-grid two-paths">
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

      <section className="ages shell">
        <div className="section-heading">
          <div>
            <p className="eyebrow">ONE CLUB · TWO STAGES</p>
            <h2>Made to grow<br /><em>with them.</em></h2>
          </div>
          <p>The experience changes as children grow — from first creative confidence to deeper practice.</p>
        </div>
        <div className="age-grid">
          {ageStages.map((stage, index) => (
            <article className={`age-card age-${index + 1}`} key={stage.age}>
              <span className="age-label">{stage.age}</span>
              <h3>{stage.title}</h3>
              <p>{stage.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="open-studio" id="open-studio">
        <div className="shell open-studio-inner">
          <div>
            <p className="eyebrow">THE EASIEST WAY IN</p>
            <h2>Don&apos;t choose a path yet.<br /><em>Just come play.</em></h2>
            <p>
              Your first step into PINO is simple: get a free pass, explore an
              Open Studio session, and let your child discover what feels right.
            </p>
            <a className="button button-light" href="#membership">Get their first Open Studio pass</a>
          </div>
          <div className="pass-card">
            <span>FREE · 4 PASSES / MONTH</span>
            <strong>4</strong>
            <p>ways to experience PINO</p>
            <div className="pass-list">
              <span>01 · Piano</span>
              <span>02 · Art</span>
              <span>03 · Little Piner</span>
              <span>04 · Bring a friend</span>
            </div>
          </div>
        </div>
      </section>

      <section className="how-it-works shell" id="how-it-works">
        <div className="section-heading">
          <div>
            <p className="eyebrow">WHAT HAPPENS?</p>
            <h2>Four easy steps.</h2>
          </div>
          <p>No pressure to commit. Start by giving them one afternoon to explore.</p>
        </div>
        <div className="steps-grid">
          {steps.map((step) => (
            <article className="step-card" key={step.number}>
              <span>{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.detail}</p>
            </article>
          ))}
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
            <p>Four monthly passes: Piano, Art, Little Piner, and one Bring-a-Friend pass.</p>
            <ul>
              <li>1 Piano pass</li>
              <li>1 Art pass</li>
              <li>1 Little Piner pass</li>
              <li>1 Bring-a-Friend pass</li>
            </ul>
            <a className="card-link" href="#open-studio">Get my first pass →</a>
          </article>
          <article className="membership-card premium">
            <p className="eyebrow">PREMIUM · 14-DAY TRIAL</p>
            <h3>Go deeper</h3>
            <p>Full access to the PINO experience when your child finds something worth coming back for.</p>
            <ul>
              <li>Full PINO experience</li>
              <li>Continue Art or Piano</li>
              <li>14-day Premium trial</li>
            </ul>
            <a className="card-link" href="#open-studio">Try PINO first →</a>
          </article>
        </div>
      </section>

      <section className="afterwork shell">
        <div className="afterwork-inner">
          <div>
            <p className="eyebrow">COMING LATER · AFTERWORK</p>
            <h2>For grown-ups<br /><em>who need a little room to breathe.</em></h2>
          </div>
          <p>
            A future PINO series for adults: healing, creative evenings built
            around painting and piano. Come after work. Make something. Leave a
            little lighter.
          </p>
        </div>
      </section>

      <section className="final-cta">
        <div className="shell final-cta-inner">
          <p className="eyebrow">READY TO LET THEM EXPLORE?</p>
          <h2>Give them one afternoon<br /><em>to make, play and discover.</em></h2>
          <a className="button button-dark" href="#open-studio">Get their first Open Studio pass</a>
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
