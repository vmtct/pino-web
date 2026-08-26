import type { CSSProperties } from "react";
import type { Metadata } from "next";
import styles from "./page.module.css";
import { PathFooter, PathHeader } from "../components/path-chrome";
import { Localized as L } from "../localization";

export const metadata: Metadata = {
  title: "Artchitect — PINO House",
  description: "Observe. Make. Design. Build. Discover Artchitect at PINO House.",
};

const ASSET = "https://assets.pinohouse.art/site/Artchitect";

const journey = [
  { en: ["Line", "We begin by observing closely and drawing with intention."], vi: ["Nét", "Bắt đầu bằng quan sát kỹ và vẽ với chủ đích."], image: "artchitect-journey-01-line.png" },
  { en: ["Form", "We explore shape and structure with our hands and materials."], vi: ["Hình khối", "Khám phá hình và cấu trúc bằng đôi tay cùng nhiều chất liệu."], image: "artchitect-journey-02-form.png" },
  { en: ["Light", "We explore light, shadow, and atmosphere to reveal mood."], vi: ["Ánh sáng", "Khám phá ánh sáng, bóng đổ và không khí để tạo nên cảm xúc."], image: "artchitect-journey-03-light.png" },
  { en: ["Color", "We discover harmony, contrast, and the feeling color can hold."], vi: ["Màu sắc", "Khám phá hòa sắc, tương phản và cảm xúc mà màu sắc có thể mang theo."], image: "artchitect-journey-04-color.png" },
  { en: ["Composition", "We arrange, balance, and design with purpose."], vi: ["Bố cục", "Sắp xếp, cân bằng và thiết kế với chủ đích."], image: "artchitect-journey-05-composition.png" },
  { en: ["Story", "We bring it all together to tell stories that matter."], vi: ["Câu chuyện", "Kết nối tất cả để kể nên những câu chuyện có ý nghĩa."], image: "artchitect-journey-06-story.png" },
] as const;

const process = [
  { en: ["Observe & draw", "We build seeing skills through sketching, studies, and wondering about the world."], vi: ["Quan sát & vẽ", "Rèn khả năng nhìn qua ký hoạ, nghiên cứu và những câu hỏi về thế giới xung quanh."], pos: "2.5%" },
  { en: ["Explore & experiment", "We try new materials and techniques, and learn through play and discovery."], vi: ["Khám phá & thử nghiệm", "Thử chất liệu và kỹ thuật mới, học qua chơi và khám phá."], pos: "26.5%" },
  { en: ["Make & build", "We shape ideas in three dimensions, from maquettes to expressive sculptures."], vi: ["Làm & dựng", "Đưa ý tưởng thành hình khối ba chiều, từ mô hình nhỏ đến điêu khắc biểu cảm."], pos: "50%" },
  { en: ["Imagine & create", "We develop our voice through original artworks and visual storytelling."], vi: ["Tưởng tượng & sáng tạo", "Phát triển tiếng nói riêng qua tác phẩm nguyên bản và kể chuyện bằng hình ảnh."], pos: "73.5%" },
  { en: ["Reflect & share", "We celebrate progress and learn from each other’s tools and ideas."], vi: ["Nhìn lại & chia sẻ", "Ghi nhận tiến bộ và học từ công cụ, cách làm cùng ý tưởng của nhau."], pos: "97.5%" },
] as const;

const projects = [
  { en: ["Character studies", "Expressive drawings that explore personality, pose, and emotion."], vi: ["Nghiên cứu nhân vật", "Những bài vẽ biểu cảm khám phá tính cách, dáng và cảm xúc."], image: "character-design-sketchbook.png" },
  { en: ["Observational painting", "Learning to see color, value, and form in the world around us."], vi: ["Vẽ quan sát", "Học cách nhìn màu, sắc độ và hình khối trong thế giới xung quanh."], image: "classic-still-life-painting.png" },
  { en: ["Models & maquettes", "Design, build, and problem-solve with scale, structure, and detail."], vi: ["Mô hình & maquette", "Thiết kế, dựng và giải quyết vấn đề qua tỉ lệ, cấu trúc và chi tiết."], image: "architectural-model-workshop.png" },
  { en: ["Illustration & narrative", "Visual storytelling that connects imagination with meaning."], vi: ["Minh hoạ & tự sự", "Kể chuyện bằng hình ảnh để kết nối trí tưởng tượng với ý nghĩa."], image: "coastal-village-watercolor.png" },
  { en: ["Compositions & studies", "Exploring layout, pattern, and visual rhythm across mediums."], vi: ["Bố cục & nghiên cứu", "Khám phá sắp đặt, hoạ tiết và nhịp điệu thị giác qua nhiều chất liệu."], image: "blue-architecture-concept-board.png" },
] as const;

const gallery = ["cathedral-perspective-drawing.png","young-woman-painted-portrait.png","bird-color-study.png","watercolor-painting-closeup.png","classical-sculpture-bust.png","mountain-landscape-sketchbook.png","oil-paint-sticks-and-palette.png"];

export default function ArtchitectPage() {
  return (
    <main className={styles.page}>
      <PathHeader styles={styles} />

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <h1>Artchitect</h1>
          <p className={styles.heroLead}><L vi="Quan sát. Làm. Thiết kế. Dựng." en="Observe. Make. Design. Build." /></p>
          <p className={styles.heroText}><L vi="Nuôi dưỡng cách trẻ nhìn và kiến tạo thế giới thị giác." en="We shape the way children see and build the visual world." /></p>
          <div className={styles.actions}>
            <a className={styles.primary} href="#journey"><L vi="Khám phá Artchitect" en="Explore Artchitect" /> <span>→</span></a>
            <a className={styles.secondary} href="/open-studio"><L vi="Ghé Open Studio" en="Visit the Studio" /> <span>→</span></a>
          </div>
        </div>
        <div className={styles.heroImage}><img src={`${ASSET}/artist-studio-workspace.png`} alt="Artchitect studio workspace" /></div>
      </section>

      <section className={styles.section} id="journey">
        <div className={styles.sectionLead}><h2><L vi="Hành trình Artchitect" en="The Artchitect Journey" /></h2><span>✦</span><p><L vi={<>Một cách để nhìn. Một cách để làm.<br/>Một cách để tạo nên câu chuyện trong thế giới.</>} en={<>A way of seeing. A way of making.<br/>A way of shaping stories in the world.</>} /></p></div>
        <div className={styles.journeyGrid}>
          {journey.map((item, i) => <article className={styles.journeyCard} key={item.image}><img src={`${ASSET}/${item.image}`} alt=""/><h3><L vi={item.vi[0]} en={item.en[0]} /></h3><p><L vi={item.vi[1]} en={item.en[1]} /></p>{i < journey.length - 1 ? <span className={styles.arrow}>→</span> : null}</article>)}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionLead}><h2><L vi="Bên trong studio" en="Inside the studio" /></h2><span>✦</span><p><L vi="Cách chúng mình học và lớn lên cùng nhau." en="How we learn and grow together." /></p><a href="#projects"><L vi="Cách Artchitect học" en="Our approach" /> →</a></div>
        <div className={styles.cardGrid}>
          {process.map((item, i) => {
            const cropStyle = { backgroundImage: `url(${ASSET}/creative-process-photo-strip.png)`, backgroundPosition: `${item.pos} center` } as CSSProperties;
            return <article className={`${styles.featureCard} ${i === process.length - 1 ? styles.mobileOrphan : ""}`} key={item.pos}><div className={styles.processCrop} style={cropStyle} aria-hidden="true" /><h3><L vi={item.vi[0]} en={item.en[0]} /></h3><p><L vi={item.vi[1]} en={item.en[1]} /></p></article>;
          })}
        </div>
      </section>

      <section className={styles.section} id="projects">
        <div className={styles.sectionLead}><h2><L vi="Dự án & thành quả" en="Projects & outcomes" /></h2><p><L vi="Từ ý tưởng đến những tác phẩm có ý nghĩa và để lại dấu ấn." en="From ideas to meaningful work that leaves a mark." /></p><a href="#gallery"><L vi="Xem câu chuyện học viên" en="See student stories" /> →</a></div>
        <div className={styles.cardGrid}>
          {projects.map((item, i) => <article className={`${styles.featureCard} ${i === projects.length - 1 ? styles.mobileOrphan : ""}`} key={item.image}><img src={`${ASSET}/${item.image}`} alt=""/><h3><L vi={item.vi[0]} en={item.en[0]} /></h3><p><L vi={item.vi[1]} en={item.en[1]} /></p></article>)}
        </div>
      </section>

      <section className={`${styles.section} ${styles.gallerySection}`} id="gallery">
        <div className={styles.sectionLead}><h2><L vi="Được làm tại studio" en="Made in the studio" /></h2><span>✦</span></div>
        <div className={styles.gallery}>{gallery.map((image, i) => <img className={i === gallery.length - 1 ? styles.galleryOrphan : ""} key={image} src={`${ASSET}/${image}`} alt="Artchitect studio work" />)}</div>
      </section>

      <section className={styles.cta}>
        <img src={`${ASSET}/rust-blue-painted-texture-banner.png`} alt=""/>
        <div><h2><L vi="Ghé thăm Artchitect." en="Come visit Artchitect." /></h2><p><L vi="Bước vào studio và nhìn thấy sáng tạo đang diễn ra." en="Step into the studio and see creativity in action." /></p><a href="/open-studio"><L vi="Ghé Open Studio" en="Visit the Studio" /> <span>→</span></a></div>
      </section>

      <PathFooter styles={styles} leadClassName={styles.footerWide} stayClassName={styles.footerWide} />
      <img className={styles.botanicalLeft} src={`${ASSET}/botanical-leaf-illustration.png`} alt=""/>
      <img className={styles.botanicalRight} src={`${ASSET}/neutral-botanical-abstract.png`} alt=""/>
    </main>
  );
}
