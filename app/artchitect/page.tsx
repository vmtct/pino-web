import type { Metadata } from "next";
import styles from "./page.module.css";
import { PathFooter, PathHeader } from "../components/path-chrome";
import { Localized as L } from "../localization";
import {PathIntro} from "../path-intro";
import { ArtworkLightbox } from "./artwork-lightbox";

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


const gallery = [
  { file: "Chibi Tuong Vy.jpg", name: "Chibi · Tường Vy" },
  { file: "Collage Thanh Tam.jpg", name: "Collage · Thanh Tâm" },
  { file: "DarkDream Toan.png", name: "Dark Dream · Toàn" },
  { file: "House Collage Phuc An.jpg", name: "House Collage · Phúc An" },
  { file: "Jina Minh Anh.jpg", name: "Jina · Minh Anh" },
  { file: "Museum Nhat Nghi.jpg", name: "Museum · Nhật Nghi" },
  { file: "StillLife - Ngoc Han.jpg", name: "Still Life · Ngọc Hân" },
  { file: "Unknown Thao.jpg", name: "Artwork · Thảo" },
];

export default function ArtchitectPage() {
  return (
    <main className={styles.page} data-pino-marketing-page data-path-theme="artchitect">
      <PathHeader activeHref="/afterschool"/>

      <PathIntro path="artchitect"/>

      <section className={`${styles.section} ${styles.specialtySection}`} id="specialties">
        <div className={styles.sectionLead}><h2><L vi="Hai nhánh chuyên môn phát triển" en="Two creative development paths" /></h2><p><L vi="Từ nền tảng mỹ thuật, con chọn hướng phát triển phù hợp với cách mình muốn sáng tạo." en="From artistic foundations, children grow through the creative direction that speaks to them." /></p></div>
        <div className={styles.specialtyGrid}>
          <a className={styles.specialtyCard} href="/artchitect/material-illustration"><img src={`${ASSET}/Illustration/Watercolor%20Art%20Studio%20with%20Landscape%20Easel.png`} alt=""/><div><span>01 · <L vi="HỘI HỌA & CHẤT LIỆU" en="PAINTING & MATERIALS"/></span><h3><L vi="Minh họa chất liệu" en="Mixed-Media Illustration"/></h3><p><L vi="Phát triển khả năng quan sát, phối màu và biểu đạt qua màu nước, acrylic, gouache, marker và chất liệu kết hợp." en="Build observation, color and expression through watercolor, acrylic, gouache, markers and mixed media."/></p><strong><L vi="Khám phá nhánh này" en="Explore this path"/> →</strong></div></a>
          <a className={styles.specialtyCard} href="/artchitect/character-design"><img src={`${ASSET}/Character/Dreamy%20Watercolor%20Artist%E2%80%99s%20Studio.png`} alt=""/><div><span>02 · <L vi="THIẾT KẾ & KỂ CHUYỆN" en="DESIGN & STORYTELLING"/></span><h3><L vi="Thiết kế nhân vật" en="Character Design"/></h3><p><L vi="Phát triển tư duy tạo hình, cá tính nhân vật và kể chuyện qua cartoon, anime, chibi, fantasy và nhân vật nguyên bản." en="Develop visual design, character identity and storytelling through cartoon, anime, chibi, fantasy and original characters."/></p><strong><L vi="Khám phá nhánh này" en="Explore this path"/> →</strong></div></a>
        </div>
      </section>
      <section className={styles.section} id="journey">
        <div className={styles.sectionLead}><h2><L vi="Hành trình Artchitect" en="The Artchitect Journey" /></h2><span>✦</span><p><L vi={<>Một cách để nhìn. Một cách để làm.<br/>Một cách để tạo nên câu chuyện trong thế giới.</>} en={<>A way of seeing. A way of making.<br/>A way of shaping stories in the world.</>} /></p></div>
        <div className={styles.journeyGrid}>
          {journey.map((item, i) => <article className={styles.journeyCard} key={item.image}><img src={`${ASSET}/${item.image}`} alt=""/><h3><L vi={item.vi[0]} en={item.en[0]} /></h3><p><L vi={item.vi[1]} en={item.en[1]} /></p>{i < journey.length - 1 ? <span className={styles.arrow}>→</span> : null}</article>)}
        </div>
      </section>

      <section className={styles.section}>
        
        <div className={styles.studioVideo}>
          <div className={styles.studioVideoFrame}>
            <iframe src="https://www.youtube-nocookie.com/embed/OwP0WeTONC0?playsinline=1&rel=0" title="Artchitect — Bên trong studio" loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
          </div>
          <div className={styles.studioVideoCopy}>
            <span><L vi="MỘT GÓC STUDIO" en="A GLIMPSE INSIDE" /></span><h2 className={styles.studioHeading}><L vi="Bên trong studio" en="Inside the studio" /> ✦</h2><p className={styles.studioSubheading}><L vi="Cách chúng mình học và lớn lên cùng nhau." en="How we learn and grow together." /></p>
            <h3><L vi="Nơi ý tưởng trở thành tác phẩm" en="Where ideas become artworks" /></h3>
            <p><L vi="Nhìn gần hơn những khoảnh khắc khám phá, thử nghiệm và sáng tạo trong Artchitect." en="Take a closer look at the moments of exploration, experimentation and creation at Artchitect." /></p>
          </div>
        </div>
      </section>



      <section className={`${styles.section} ${styles.gallerySection}`} id="gallery">
        <div className={styles.sectionLead}><h2><L vi="Được làm tại studio" en="Made in the studio" /></h2><span>✦</span></div>
        <ArtworkLightbox works={gallery} assetRoot={ASSET} />
      </section>

      <section className={styles.digitalBanner} aria-labelledby="digital-art-heading"><div><span><L vi="CHUYÊN ĐỀ ĐẶC BIỆT" en="SPECIAL TOPIC"/></span><h2 id="digital-art-heading"><L vi="Mỹ thuật số" en="Digital Art"/></h2><p><L vi="Từ nét vẽ trên giấy đến sáng tạo trên màn hình: khám phá công cụ số, minh họa và thiết kế nhân vật trong một chuyên đề riêng." en="From paper to screen: explore digital tools, illustration and character design in a dedicated special topic."/></p><a href="/artchitect/digital-art"><L vi="Khám phá Mỹ thuật số" en="Explore the special topic"/> →</a></div><img src="https://assets.pinohouse.art/site/Artchitect/Cozy%20Digital%20Artist%E2%80%99s%20Desk%20Scene.png" alt=""/></section>
      <section className={styles.cta}>
        <img src={`${ASSET}/rust-blue-painted-texture-banner.png`} alt=""/>
        <div><h2><L vi="Ghé thăm Artchitect." en="Come visit Artchitect." /></h2><p><L vi="Bước vào studio và nhìn thấy sáng tạo đang diễn ra." en="Step into the studio and see creativity in action." /></p><a href="/open-studio"><L vi="Ghé Open Studio" en="Visit the Studio" /> <span>→</span></a></div>
      </section>

      <section className="pino-path-consult" data-path-consult="artchitect"><h2><L vi="Bắt đầu hành trình của con" en="Begin your child’s journey"/></h2><a href="/afterschool?path=artchitect#register"><L vi="Đăng ký tư vấn" en="Register interest"/> →</a></section><PathFooter/>
      <img className={styles.botanicalLeft} src={`${ASSET}/botanical-leaf-illustration.png`} alt=""/>
      <img className={styles.botanicalRight} src={`${ASSET}/neutral-botanical-abstract.png`} alt=""/>
    </main>
  );
}
