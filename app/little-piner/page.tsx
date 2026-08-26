import type { Metadata } from "next";
import styles from "./page.module.css";
import { PathFooter, PathHeader } from "../components/path-chrome";
import { Localized as L } from "../localization";

export const metadata: Metadata = {
  title: "Little Piner — PINO House",
  description: "Little hands. Big discoveries. Art and piano for children ages 3–6 at PINO House.",
};

const ASSET = "https://assets.pinohouse.art/site/littlePiner";
const asset = (name: string) => `${ASSET}/${encodeURIComponent(name)}`;

const learning = [
  { en:["Play","Explore, wonder and make sense of the world."], vi:["Chơi","Khám phá, tò mò và dần hiểu thế giới qua chơi."], image:"ChatGPT Image Aug 26, 2026, 08_53_07 AM (5).png" },
  { en:["Sense","Feel, touch, hear and see with the whole body."], vi:["Cảm nhận","Chạm, nghe, nhìn và cảm bằng cả cơ thể."], image:"ChatGPT Image Aug 26, 2026, 08_53_09 AM (6).png" },
  { en:["Repeat","Build understanding and confidence through familiar rhythms."], vi:["Lặp lại","Xây sự hiểu biết và tự tin qua những nhịp điệu quen thuộc."], image:"ChatGPT Image Aug 26, 2026, 08_53_11 AM (7).png" },
  { en:["Move","Express, connect and stay joyful through movement."], vi:["Chuyển động","Biểu đạt, kết nối và giữ niềm vui qua vận động."], image:"ChatGPT Image Aug 26, 2026, 08_53_14 AM (8).png" },
  { en:["Make","Turn ideas into something real, tactile and meaningful."], vi:["Làm","Biến ý tưởng thành điều có thể chạm, nhìn và tự hào."], image:"ChatGPT Image Aug 26, 2026, 08_53_16 AM (9).png" },
] as const;

const inside = [
  { en:["Warm & welcoming","A cozy space that feels familiar, calm and inviting."], vi:["Ấm áp & gần gũi","Một không gian thân thuộc, nhẹ nhàng và dễ bước vào."], image:"ChatGPT Image Aug 26, 2026, 08_53_52 AM (1).png" },
  { en:["Art in every corner","Natural materials and open-ended tools ready to explore."], vi:["Nghệ thuật ở mọi góc","Chất liệu tự nhiên và công cụ mở để trẻ tự do khám phá."], image:"ChatGPT Image Aug 26, 2026, 08_53_53 AM (2).png" },
  { en:["Music up close","A child-sized invitation to listen, touch and play."], vi:["Âm nhạc thật gần","Một lời mời vừa tầm để nghe, chạm và chơi."], image:"ChatGPT Image Aug 26, 2026, 08_53_54 AM (3).png" },
  { en:["Together & supported","Small groups, caring teachers and gentle connection."], vi:["Cùng nhau & được nâng đỡ","Nhóm nhỏ, giáo viên quan tâm và kết nối nhẹ nhàng."], image:"ChatGPT Image Aug 26, 2026, 08_53_56 AM (4).png" },
  { en:["Safe & loved","Soft routines and a space where little learners can settle in."], vi:["An toàn & được yêu thương","Nhịp sinh hoạt êm dịu để trẻ nhỏ cảm thấy yên tâm và thuộc về."], image:"ChatGPT Image Aug 26, 2026, 08_53_58 AM (5).png" },
] as const;

const growth = [
  { en:["Confidence","Proud to try, choose and share."], vi:["Tự tin","Dám thử, dám chọn và vui khi chia sẻ."], image:"ChatGPT Image Aug 26, 2026, 08_54_00 AM (6).png" },
  { en:["Focus","Staying with an experience a little longer each time."], vi:["Tập trung","Ở lại với một trải nghiệm lâu hơn một chút qua từng lần."], image:"ChatGPT Image Aug 26, 2026, 08_54_02 AM (7).png" },
  { en:["Fine motor","Small hands growing stronger and more skillful."], vi:["Khéo tay","Đôi tay nhỏ dần mạnh hơn và khéo léo hơn."], image:"ChatGPT Image Aug 26, 2026, 08_54_04 AM (8).png" },
  { en:["Listening","Hearing carefully and responding with understanding."], vi:["Lắng nghe","Nghe kỹ hơn và phản hồi với sự thấu hiểu."], image:"ChatGPT Image Aug 26, 2026, 08_54_06 AM (9).png" },
  { en:["Expression","Finding a voice through art, music and play."], vi:["Biểu đạt","Tìm thấy tiếng nói riêng qua nghệ thuật, âm nhạc và chơi."], image:"ChatGPT Image Aug 26, 2026, 08_54_08 AM (10).png" },
] as const;

const gallery = ["ChatGPT Image Aug 26, 2026, 08_57_15 AM.png","ChatGPT Image Aug 26, 2026, 08_57_24 AM.png","ChatGPT Image Aug 26, 2026, 08_55_24 AM (3).png","ChatGPT Image Aug 26, 2026, 08_55_26 AM (4).png","ChatGPT Image Aug 26, 2026, 08_55_28 AM (5).png","ChatGPT Image Aug 26, 2026, 08_55_30 AM (6).png"] as const;

export default function LittlePinerPage() {
  return (
    <main className={styles.page}>
      <PathHeader styles={styles} />

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}><L vi="3–6 tuổi · Little Piner" en="Ages 3–6 · Little Piner" /></p>
          <h1>Little Piner</h1>
          <p className={styles.heroLead}><L vi="Đôi tay nhỏ. Những khám phá lớn." en="Little hands. Big discoveries." /></p>
          <p className={styles.heroText}><L vi="Một khởi đầu ấm áp cho những trái tim tò mò — nuôi dưỡng sáng tạo, tự tin và niềm vui qua nghệ thuật và âm nhạc." en="A warm beginning for curious little hearts — growing creativity, confidence and joy through art and music." /></p>
          <div className={styles.actions}>
            <a className={styles.primary} href="#paths"><L vi="Khám phá Little Piner" en="Explore Little Piner" /> <span>→</span></a>
            <a className={styles.secondary} href="/open-studio"><L vi="Ghé Open Studio" en="Visit the Studio" /> <span>→</span></a>
          </div>
          <div className={styles.trust}><span>✦ <L vi="3–6 tuổi" en="Ages 3–6" /></span><span>❀ <L vi="Học qua chơi" en="Playful learning" /></span><span>♡ <L vi="Nhóm nhỏ" en="Small groups" /></span><span>⌂ <L vi="An toàn & quan tâm" en="Safe & caring" /></span></div>
        </div>
        <div className={styles.heroImage}><img src={asset("ChatGPT Image Aug 26, 2026, 08_52_42 AM.png")} alt="Little Piner art and piano studio" /></div>
      </section>

      <section className={styles.paths} id="paths">
        <div className={styles.centerLead}><span>✦</span><h2><L vi="Hai cách để khám phá." en="Two ways to explore." /></h2><p><L vi="Một hành trình đầy niềm vui." en="One joyful journey." /></p></div>
        <div className={styles.pathGrid}>
          <article className={styles.pathCard}>
            <div className={styles.pathImage}><img src={asset("ChatGPT Image Aug 26, 2026, 08_53_02 AM (2).png")} alt="Art with Little Piner" /></div>
            <div className={styles.pathCopy}><span className={`${styles.badge} ${styles.sage}`}>ART</span><h3>Art <em><L vi="cùng Little Piner" en="with Little Piner" /></em></h3><strong>Vẽ · Nặn · Chạm · Làm</strong><p><L vi="Màu sắc, hình khối và chất liệu trở thành một cách nhẹ nhàng để khám phá, tập trung và biểu đạt." en="Colors, shapes and materials become a gentle way to explore, focus and express." /></p><a href="#gallery"><L vi="Khám phá Art" en="Explore Art" /> →</a></div>
          </article>
          <div className={styles.pathBridge}><img src={asset("ChatGPT Image Aug 26, 2026, 08_53_06 AM (4).png")} alt="" /><span><L vi={<>Một ngôi nhà nhỏ.<br/>Nhiều cách để lớn lên.</>} en={<>One little house.<br/>Many ways to grow.</>} /></span></div>
          <article className={`${styles.pathCard} ${styles.pathCardReverse}`}>
            <div className={styles.pathCopy}><span className={`${styles.badge} ${styles.terra}`}>PIANO</span><h3>Piano <em><L vi="cùng Little Piner" en="with Little Piner" /></em></h3><strong>Nghe · Cảm · Chơi · Hiểu · Thể hiện</strong><p><L vi="Những giai điệu đơn giản mời trẻ lắng nghe, cảm nhận, chơi và phản hồi bằng niềm vui." en="Simple melodies invite children to listen, feel, play and respond with joy." /></p><a href="#inside"><L vi="Khám phá Piano" en="Explore Piano" /> →</a></div>
            <div className={styles.pathImage}><img src={asset("ChatGPT Image Aug 26, 2026, 08_53_04 AM (3).png")} alt="Piano with Little Piner" /></div>
          </article>
        </div>
      </section>

      <section className={styles.editorialSection}>
        <div className={styles.sectionLead}><h2><L vi="Trẻ nhỏ học như thế nào" en="How little children learn" /></h2><span>♥</span><p><L vi="Trẻ nhỏ học tốt nhất qua chơi, kết nối và những trải nghiệm có ý nghĩa." en="Young children learn best through play, connection and meaningful experience." /></p><small><L vi="Mình dẫn đường. Con tự khám phá." en="We guide. They discover." /></small></div>
        <div className={styles.iconGrid}>{learning.map(item => <article className={styles.iconCard} key={item.image}><img src={asset(item.image)} alt="" loading="lazy"/><h3><L vi={item.vi[0]} en={item.en[0]} /></h3><p><L vi={item.vi[1]} en={item.en[1]} /></p></article>)}</div>
      </section>

      <section className={styles.editorialSection} id="inside">
        <div className={styles.sectionLead}><h2><L vi="Bên trong Little Piner" en="Inside Little Piner" /></h2><span>✦</span><p><L vi="Một không gian dành cho sự tò mò, an toàn và những khởi đầu đẹp." en="A space designed for wonder, safety and beautiful beginnings." /></p><a href="/open-studio"><L vi="Xem không gian" en="See our space" /> →</a></div>
        <div className={styles.photoGrid}>{inside.map(item => <article className={styles.photoCard} key={item.image}><img src={asset(item.image)} alt="" loading="lazy"/><div><h3><L vi={item.vi[0]} en={item.en[0]} /></h3><p><L vi={item.vi[1]} en={item.en[1]} /></p></div></article>)}</div>
      </section>

      <section className={`${styles.editorialSection} ${styles.growthSection}`}>
        <div className={styles.sectionLead}><h2><L vi="Lớn lên cùng nhau" en="Growing together" /></h2><span>♥</span><p><L vi="Từng chút một, mỗi ngày một chút, con lớn lên ở những điều thực sự quan trọng." en="Little by little, day by day, they grow in all the ways that matter most." /></p></div>
        <div className={styles.iconGrid}>{growth.map(item => <article className={styles.iconCard} key={item.image}><img src={asset(item.image)} alt="" loading="lazy"/><h3><L vi={item.vi[0]} en={item.en[0]} /></h3><p><L vi={item.vi[1]} en={item.en[1]} /></p></article>)}</div>
      </section>

      <section className={`${styles.editorialSection} ${styles.gallerySection}`} id="gallery">
        <div className={styles.sectionLead}><h2><L vi="Được làm bởi đôi tay nhỏ" en="Made by little hands" /></h2><span>✦</span><p><L vi="Những khoảnh khắc nhỏ, được làm nên đầy tự hào." en="Small moments, proudly made." /></p></div>
        <div><div className={styles.gallery}>{gallery.map((image, index) => <img key={image} src={asset(image)} alt={`Little Piner studio work ${index + 1}`} loading="lazy" />)}</div><p className={styles.galleryNote}><L vi="Mỗi tác phẩm, mỗi nốt nhạc, mỗi nụ cười đều là một bước trong hành trình của con. ✦" en="Every piece, every note, every smile is a step in their journey. ✦" /></p></div>
      </section>

      <section className={styles.cta}>
        <img src={asset("ChatGPT Image Aug 26, 2026, 08_55_32 AM (7).png")} alt="" loading="lazy" />
        <div><p><L vi="Bước vào ngôi nhà nhỏ." en="Step into the little house." /></p><h2><L vi="Ghé thăm Little Piner." en="Come visit Little Piner." /></h2><span><L vi="Nhìn thấy sáng tạo, âm nhạc và chơi đang diễn ra." en="See creativity, music and play in motion." /></span><a href="/open-studio"><L vi="Ghé Open Studio" en="Visit the Studio" /> <b>→</b></a></div>
      </section>

      <PathFooter styles={styles} />
      <img className={styles.botanical} src={asset("ChatGPT Image Aug 26, 2026, 08_55_34 AM (8).png")} alt="" loading="lazy" />
      <img className={styles.motifs} src={asset("ChatGPT Image Aug 26, 2026, 08_55_34 AM (9).png")} alt="" loading="lazy" />
    </main>
  );
}
