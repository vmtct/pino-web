import styles from "./homepage.module.css";
import { LocaleToggle, Localized as L } from "./localization";

const ASSET = "https://assets.pinohouse.art/site/homepage";
const SIGIL = "https://assets.pinohouse.art/core/Pino%20Sigil.png";

const paths = [
  { name:"PianoHouse", en:"Music as expression. Confidence as harmony.", vi:"Âm nhạc để biểu đạt. Tự tin lớn lên trong từng giai điệu.", image:"hands-playing-piano-top-view.png", href:"/pianohouse" },
  { name:"Artchitect", en:"Think. Design. Create. Build your own world.", vi:"Quan sát. Thiết kế. Sáng tạo. Dựng nên thế giới của riêng mình.", image:"bright-art-classroom.png", href:"/artchitect" },
  { name:"Little Piner", en:"Play, wonder, and grow — at their own beautiful pace.", vi:"Chơi, tò mò và lớn lên — theo nhịp điệu đẹp đẽ của riêng con.", image:"open-plan-creative-studio.png", href:"/little-piner" },
] as const;

const steps = [
  { en:["Discover","Spark curiosity and explore what lights them up."], vi:["Khám phá","Khơi lên tò mò và tìm điều khiến con thật sự hứng thú."], image:"autumn-leaves-round-icon.png" },
  { en:["Visit","Step into the House — virtually or in person."], vi:["Ghé thăm","Bước vào PINO House — trực tuyến hoặc trực tiếp."], image:"studio-house-entrance-round-icon.png" },
  { en:["Find your path","We’ll help your child find their way."], vi:["Tìm lộ trình","PINO cùng con tìm một hướng đi phù hợp."], image:"direction-signpost-round-icon.png" },
  { en:["Grow","Skill, confidence, and creativity that last."], vi:["Lớn lên","Kỹ năng, tự tin và sáng tạo được bồi đắp theo thời gian."], image:"potted-sprout-round-icon.png" },
] as const;

const madeAtPino = ["child-painting-at-easel.png","child-playing-piano-top-view.png","child-pottery-lesson-closeup.png","child-painting-at-studio-table.png","moonlit-village-painting.png","child-painting-botanical-watercolor-closeup.png"] as const;
const houseGallery = ["creative-studio-entrance-hall.png","cozy-creative-studio-lounge.png","grand-piano-in-creative-studio.png","children-group-art-class.png"] as const;

function Brand() {
  return <a className={styles.brand} href="#top" aria-label="PINO House home"><img src={SIGIL} alt="" /><span>PINO House</span></a>;
}

export default function Home() {
  return (
    <main className={styles.page} id="top">
      <div className={styles.shell}>
        <header className={styles.header}>
          <Brand />
          <nav className={styles.nav} aria-label="Primary navigation">
            <a href="#house"><L vi="Ngôi nhà" en="House" /></a>
            <a href="#paths"><L vi="Lộ trình" en="Paths" /></a>
            <a href="/open-studio">Open Studio</a>
            <a href="#stories"><L vi="Câu chuyện" en="Stories" /></a>
            <a href="#about"><L vi="Về PINO" en="About" /></a>
          </nav>
          <div className="pino-header-actions">
            <a className={styles.navCta} href="/open-studio"><span className={styles.ctaLabel}>Open Studio</span><span className={styles.arrowCircle} aria-hidden="true">→</span></a>
            <LocaleToggle />
          </div>
        </header>

        <section className={styles.hero} aria-labelledby="home-title">
          <div className={styles.heroCopy}>
            <h1 id="home-title"><L vi={<>Một ngôi nhà cho<br />những tâm trí<br />tò mò lớn lên.</>} en={<>A house for<br />growing curious<br />minds.</>} /></h1>
            <p><L vi="Nơi trẻ cùng nhau khám phá nghệ thuật, âm nhạc và lớn lên sáng tạo." en="Where children explore art, music, and creative growth — together." /></p>
            <div className={styles.heroActions}>
              <a className={styles.primary} href="/open-studio">Open Studio <span aria-hidden="true">→</span></a>
              <a className={styles.secondary} href="#house"><L vi="Khám phá PINO House" en="Explore the House" /></a>
            </div>
          </div>
          <div className={styles.heroVisual} aria-label="Illustrated PINO House courtyard">
            <span className={styles.heroHalo} aria-hidden="true" />
            <img className={styles.heroCampus} src={`${ASSET}/creative-campus-courtyard-illustration.png`} alt="PINO House creative campus courtyard" loading="eager" fetchPriority="high" />
          </div>
          <img className={styles.heroLeaves} src={`${ASSET}/glowing-autumn-leaves.png`} alt="" aria-hidden="true" />
        </section>

        <section className={styles.section} id="paths" aria-labelledby="paths-title">
          <div className={styles.withIntro}>
            <div className={styles.intro}>
              <h2 id="paths-title"><L vi="Bên trong PINO House" en="Inside the House" /></h2>
              <div className={styles.sparkline}><span>✦</span></div>
              <p><L vi="Ba lộ trình. Một ngôi nhà luôn chào đón. Mỗi góc PINO được tạo ra để trẻ khám phá, biểu đạt và lớn lên với sự tự tin." en="Three paths. One welcoming home. Each corner of PINO is designed for children to explore, express, and grow with confidence." /></p>
              <a className={styles.textLink} href="#house"><L vi="Tìm hiểu thêm về các lộ trình" en="Learn more about our paths" /> <span>→</span></a>
            </div>
            <div className={styles.pathGrid}>
              {paths.map(path => <article className={styles.pathCard} key={path.name}><img className={styles.cardImage} src={`${ASSET}/${path.image}`} alt="" /><div className={styles.cardCopy}><h3>{path.name}</h3><p><L vi={path.vi} en={path.en} /></p><a href={path.href}><L vi={`Khám phá ${path.name}`} en={`Explore ${path.name}`} /> <span aria-hidden="true">→</span></a></div></article>)}
            </div>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="open-title">
          <div className={styles.openStudio}>
            <div className={styles.openLead}>
              <h2 id="open-title">Open Studio</h2>
              <p><L vi="Khám phá tuần này" en="This week’s discovery" /></p>
              <h3>Watercolor Stories</h3>
              <p><L vi="Vẽ trí tưởng tượng của con. Khám phá màu sắc, chất liệu và câu chuyện qua màu nước." en="Paint your imagination. Explore color, texture, and story through watercolor." /></p>
              <a className={styles.textLink} href="/open-studio"><L vi="Xem tất cả lịch Open Studio" en="See all Open Studio sessions" /> <span>→</span></a>
            </div>
            <div className={styles.openGrid}>
              <a className={styles.openFeature} href="/open-studio" aria-label="Explore Watercolor Stories"><img src={`${ASSET}/watercolor-palette-and-floral-art.png`} alt="Watercolor palette and botanical painting" /></a>
              <article className={styles.openCard}><span className={styles.badge}><L vi="HÀNG TUẦN" en="WEEKLY" /></span><img src={`${ASSET}/child-playing-piano-top-view.png`} alt="Child exploring piano" /><div className={styles.openCardBody}><h3>Tiny Composers</h3><p><L vi="Tạo một giai điệu. Chơi, lắng nghe và khám phá." en="Create a melody. Play, listen, and discover." /></p></div></article>
              <article className={styles.openCard}><span className={styles.badge}><L vi="HÀNG TUẦN" en="WEEKLY" /></span><img src={`${ASSET}/child-pottery-lesson-closeup.png`} alt="Hands shaping clay together" /><div className={styles.openCardBody}><h3>Clay Wonders</h3><p><L vi="Nặn. Dựng. Chơi. Làm nên một điều bằng chính đôi tay." en="Shape. Build. Play. Make something with your hands." /></p></div></article>
            </div>
          </div>
        </section>

        <section className={styles.how} aria-labelledby="how-title">
          <div className={styles.howGrid}>
            <h2 className={styles.howTitle} id="how-title"><L vi="PINO vận hành như thế nào" en="How PINO works" /></h2>
            {steps.map(step => <article className={styles.step} key={step.image}><img src={`${ASSET}/${step.image}`} alt="" /><div><strong><L vi={step.vi[0]} en={step.en[0]} /></strong><p><L vi={step.vi[1]} en={step.en[1]} /></p></div></article>)}
          </div>
        </section>

        <section className={styles.section} id="stories" aria-labelledby="stories-title">
          <div className={styles.withIntro}>
            <div className={styles.intro}><h2 id="stories-title"><L vi="Được làm tại PINO" en="Made at PINO" /></h2><p><L vi="Mỗi tác phẩm đều kể một câu chuyện. Đây là một thoáng nhìn vào những điều học viên PINO làm, tưởng tượng và khám phá." en="Every creation tells a story. Here’s a glimpse of what our students make, imagine, and explore." /></p><a className={styles.textLink} href="#stories"><L vi="Xem gallery" en="View gallery" /> <span>→</span></a></div>
            <div className={styles.galleryRow}>{madeAtPino.map((image,index)=><img key={image} src={`${ASSET}/${image}`} alt={`PINO creative moment ${index+1}`} loading="eager" />)}</div>
          </div>
        </section>

        <section className={styles.section} id="house" aria-labelledby="house-title">
          <div className={styles.withIntro}>
            <div className={styles.intro}><h2 id="house-title"><L vi="Ngôi nhà" en="The House" /></h2><p><L vi="Một không gian ấm áp và truyền cảm hứng giữa lòng cộng đồng, được thiết kế cho trí tưởng tượng và kết nối." en="A warm and inspiring space in the heart of the community. Designed for imagination and connection." /></p><a className={styles.textLink} href="#about"><L vi="Nhìn vào bên trong" en="Take a look inside" /> <span>→</span></a></div>
            <div className={styles.houseRow}>{houseGallery.map((image,index)=><img key={image} src={`${ASSET}/${image}`} alt={`Inside PINO House ${index+1}`} loading="eager" />)}</div>
          </div>
        </section>

        <section className={styles.ctaWrap} aria-label="Visit PINO House">
          <div className={styles.cta}><img src={`${ASSET}/garden-archway-coral-banner.png`} alt="" aria-hidden="true" /><span className={styles.ctaOverlay} aria-hidden="true" /><div className={styles.ctaContent}><h2><L vi="Hãy đến trải nghiệm PINO House." en="Come experience the House." /></h2><p><L vi="Open Studio là nơi đẹp nhất để bắt đầu." en="Open Studio is the perfect place to start." /></p><a href="/open-studio">Open Studio <span aria-hidden="true">→</span></a></div></div>
        </section>

        <footer className={styles.footer} id="about">
          <div className={styles.footerLead}><a className={styles.footerBrand} href="#top"><img src={SIGIL} alt="" /><span>PINO House</span></a><p><L vi="Nghệ thuật. Âm nhạc. Lớn lên sáng tạo." en="Art. Music. Creative Growth." /></p><strong>pinohouse.art</strong></div>
          <div className={styles.footerCol}><h4><L vi="Khám phá" en="Explore" /></h4><a href="#house"><L vi="Ngôi nhà" en="House" /></a><a href="#paths"><L vi="Lộ trình" en="Paths" /></a><a href="/open-studio">Open Studio</a><a href="#stories"><L vi="Câu chuyện" en="Stories" /></a></div>
          <div className={styles.footerCol}><h4><L vi="Về PINO" en="About" /></h4><a href="#about"><L vi="Câu chuyện PINO" en="Our Story" /></a><a href="#house"><L vi="PINO House" en="The House" /></a><a href="#about"><L vi="Đội ngũ" en="Team" /></a><a href="#about"><L vi="Tuyển dụng" en="Careers" /></a></div>
          <div className={styles.footerCol}><h4><L vi="Thông tin" en="Information" /></h4><a href="/open-studio"><L vi="Đến thăm" en="Visit" /></a><a href="#about">FAQs</a><a href="#about"><L vi="Chính sách" en="Policies" /></a><a href="#about"><L vi="Liên hệ" en="Contact" /></a></div>
          <div className={styles.news}><h4><L vi="Kết nối" en="Stay connected" /></h4><p><L vi="Nhận tin về Open Studio và các hoạt động đặc biệt." en="Get news about Open Studio and special events." /></p><div className={styles.emailMock} aria-label="Newsletter coming soon"><span><L vi="Email của bạn" en="Your email" /></span><span>→</span></div><div className={styles.socials} aria-hidden="true">◎ f ▶</div></div>
          <small className={styles.copyright}>© {new Date().getFullYear()} PINO House. <L vi="Đã đăng ký bản quyền." en="All rights reserved." /></small>
          <img className={styles.footerLeaves} src={`${ASSET}/glowing-autumn-leaves.png`} alt="" aria-hidden="true" />
        </footer>
      </div>
    </main>
  );
}
