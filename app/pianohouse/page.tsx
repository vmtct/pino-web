import type { Metadata } from "next";
import styles from "./page.module.css";
import { PathFooter, PathHeader } from "../components/path-chrome";

export const metadata: Metadata = {
  title: "PianoHouse — PINO House",
  description: "Âm nhạc để biểu đạt. Tự tin theo năm tháng. Khám phá PianoHouse tại PINO House.",
};

const ASSET = "https://assets.pinohouse.art/site/pianohouse";
const FOLIAGE_LEFT = "https://assets.pinohouse.art/site/Artchitect/botanical-leaf-illustration.png";
const FOLIAGE_RIGHT = "https://assets.pinohouse.art/site/Artchitect/neutral-botanical-abstract.png";
const STUDENT_VIDEO = "https://www.youtube-nocookie.com/embed/x_H1mEDuvTE?list=PLw19K34NDuLiJHTQWj3AjtfVGIPWRwwvc&rel=0&playsinline=1";
const STUDENT_VIDEO_URL = "https://www.youtube.com/watch?v=x_H1mEDuvTE&list=PLw19K34NDuLiJHTQWj3AjtfVGIPWRwwvc";

const collections = [
  ["Thế giới kỳ diệu", "Những giai điệu vui tươi khơi mở tò mò và trí tưởng tượng.", "dreamlike-piano-under-starry-sky.png"],
  ["Chuyện kể điện ảnh", "Những chủ đề quen thuộc từ phim ảnh, được kể lại qua phím đàn.", "glowing-film-strips-and-reel.png"],
  ["Chuyện kể bên phím đàn", "Những tác phẩm giàu hình ảnh, cảm xúc và câu chuyện riêng.", "grand-piano-in-sunlit-living-room.png"],
  ["Miền mộng tưởng", "Âm nhạc dịu dàng cho những khoảnh khắc lắng lại và trí tưởng tượng bay xa.", "crescent-moon-above-clouds.png"],
] as const;

const journey = [
  ["1", "Nốt nhạc đầu tiên", "Làm quen bàn phím và tìm thấy niềm vui trong âm thanh.", "01-first-notes.svg"],
  ["2", "Giai điệu", "Chơi những câu nhạc đơn giản và bắt đầu phối hợp hai tay.", "02-melody.svg"],
  ["3", "Hai tay", "Xây khả năng phối hợp, kiểm soát và chơi liền mạch hơn.", "03-two-hands.svg"],
  ["4", "Biểu cảm", "Đưa âm nhạc thành câu chuyện bằng sắc thái, nhịp thở và cảm xúc.", "04-expression.svg"],
  ["5", "Trình diễn", "Chia sẻ âm nhạc với sự tự tin, tự nhiên và niềm vui.", "05-performance.svg"],
] as const;

const lesson = [
  ["Chào & kết nối", "Lắng nghe, làm quen và cùng đặt nhịp cho buổi học.", "piano-lesson-with-teacher.png", "♥"],
  ["Kỹ thuật", "Xây nền tảng vững, nhẹ nhàng và đẹp ngay từ đầu.", "hands-playing-piano-closeup.png", "♩"],
  ["Tác phẩm", "Học những bản nhạc vừa truyền cảm hứng, vừa tạo thử thách phù hợp.", "sheet-music-on-piano.png", "♫"],
  ["Biểu cảm", "Khám phá sắc thái, cách kể chuyện và cá tính âm nhạc riêng.", "girl-playing-piano-with-fairy-lights.png", "✦"],
  ["Nhìn lại", "Nhận ra tiến bộ, ghi dấu thành quả và chọn mục tiêu tiếp theo.", "girl-drawing-at-sunlit-desk.png", "◒"],
] as const;

const moments = [
  ["Buổi biểu diễn học viên", "girl-play-piano-mid.png"],
  ["Hướng dẫn chuyên sâu", "girl-with-teacher.png"],
  ["Trải nghiệm hòa nhạc", "stage.png"],
  ["Chứng nhận & dấu mốc", "girl-with-friends.png"],
  ["Khoảnh khắc PianoHouse", "girl-playing-grand-piano-at-home.png"],
] as const;

const mobilePolishStyles = `
.pianoStudentStory{
  display:grid;
  grid-template-columns:minmax(0,1.45fr) minmax(250px,.72fr);
  overflow:hidden;
  align-self:start;
  border:1px solid rgba(115,78,55,.14);
  border-radius:16px;
  background:rgba(255,255,255,.62);
  box-shadow:0 16px 40px rgba(76,48,34,.055);
}
.pianoStudentVideo{
  position:relative;
  min-height:330px;
  background:#120d0d;
}
.pianoStudentVideo iframe{
  position:absolute;
  inset:0;
  width:100%;
  height:100%;
  border:0;
}
.pianoStudentCopy{
  display:flex;
  flex-direction:column;
  justify-content:center;
  padding:28px 28px 26px;
}
.pianoStudentMeta{
  display:flex;
  flex-wrap:wrap;
  gap:7px;
  margin-bottom:17px;
}
.pianoStudentMeta span{
  display:inline-flex;
  align-items:center;
  min-height:27px;
  padding:0 10px;
  border:1px solid rgba(183,124,53,.24);
  border-radius:999px;
  background:#fff8ee;
  color:#8d5e28;
  font:700 9px/1 Arial,sans-serif;
  letter-spacing:.035em;
}
.pianoStudentSong{
  margin-bottom:7px!important;
  color:#b77c35;
  font:700 9px/1.2 Arial,sans-serif;
  letter-spacing:.12em;
  text-transform:uppercase;
}
.pianoStudentCopy h3{
  margin:0 0 10px;
  color:#102c50;
  font-size:27px;
  line-height:1.03;
  font-weight:500;
  letter-spacing:-.025em;
  text-wrap:balance;
}
.pianoStudentCopy p:not(.pianoStudentSong){
  margin-bottom:17px;
  color:#607489;
  font:11.5px/1.62 Arial,sans-serif;
  text-wrap:pretty;
}
.pianoStudentCopy a{
  width:max-content;
  color:#741423;
  text-decoration:none;
  font:700 10.5px Arial,sans-serif;
}

@media (max-width:1100px){
  .pianoStudentStory{grid-template-columns:1fr;}
  .pianoStudentVideo{min-height:0;aspect-ratio:16/9;}
  .pianoStudentCopy{padding:22px 24px 24px;}
}

@media (max-width:760px){
  .${styles.page}{overflow-x:hidden;}
  .${styles.header}{position:sticky;top:0;height:62px;padding:0 16px;background:rgba(252,248,243,.96);box-shadow:0 8px 22px rgba(64,42,30,.045);}
  .${styles.brand}{gap:7px;font-size:18px;}
  .${styles.brand} img{width:22px;height:27px;}
  .${styles.navCta}{width:auto;min-width:96px;height:40px;min-height:40px;padding:0 12px;font-size:10px;box-shadow:0 7px 18px rgba(94,13,25,.12);}
  .${styles.navCta} span{font-size:12px;}

  .${styles.hero}{display:flex;flex-direction:column;min-height:0;background:#fbf7f1;}
  .${styles.heroCopy}{padding:28px 16px 22px;}
  .${styles.eyebrow}{margin-bottom:9px;font-size:8.8px;letter-spacing:.13em;}
  .${styles.hero} h1{margin-bottom:10px;font-size:50px;line-height:.92;letter-spacing:-.045em;}
  .${styles.heroLead}{max-width:330px;margin-bottom:9px;font-size:17.5px;line-height:1.3;}
  .${styles.heroText}{max-width:none;margin-bottom:18px;font-size:13.2px;line-height:1.6;}
  .${styles.actions}{display:grid;grid-template-columns:1.06fr .94fr;gap:8px;width:100%;}
  .${styles.primary},.${styles.secondary}{min-height:42px;padding:0 11px;font-size:10.3px;white-space:nowrap;}
  .${styles.heroImage}{height:236px;min-height:0;}
  .${styles.heroImage}::before{display:none;}
  .${styles.heroImage} img{object-position:center 54%;}
  .${styles.heroFoliage}{width:70px;left:-26px;bottom:212px;opacity:.36;}

  .${styles.contentSection},.${styles.journeySection}{display:block;padding:28px 16px 30px;}
  .${styles.sectionLead}{max-width:none;margin-bottom:18px;padding:0;}
  .${styles.sectionKicker}{margin-bottom:7px;font-size:8.7px;letter-spacing:.12em;}
  .${styles.sectionLead} h2{max-width:330px;margin-bottom:9px;font-size:29px;line-height:1.03;}
  .${styles.sectionLead} p{max-width:none;margin-bottom:14px;font-size:12.4px;line-height:1.6;}
  .${styles.sectionLead} a{font-size:11.2px;}

  .${styles.collectionGrid}{display:grid;grid-auto-flow:column;grid-auto-columns:82%;grid-template-columns:none;gap:12px;overflow-x:auto;overflow-y:hidden;padding:1px 0 5px;scroll-snap-type:x mandatory;scrollbar-width:none;-webkit-overflow-scrolling:touch;}
  .${styles.collectionGrid}::-webkit-scrollbar{display:none;}
  .${styles.collectionCard}{scroll-snap-align:start;border-radius:13px;}
  .${styles.collectionCard}>img{aspect-ratio:1.58/1;}
  .${styles.collectionCard}>div{padding:12px 13px 13px;}
  .${styles.collectionCard} h3{font-size:16px;}
  .${styles.collectionCard} p{min-height:0;font-size:10.8px;line-height:1.5;}
  .${styles.collectionCard} a{font-size:10.5px;}

  .${styles.journeyGrid}{display:grid;grid-template-columns:1fr;gap:10px;padding-top:0;}
  .${styles.journeyGrid}::before{display:none;}
  .${styles.journeyStep}{display:grid;grid-template-columns:48px 1fr;grid-template-areas:"icon number" "icon title" "icon copy";column-gap:12px;row-gap:1px;align-items:start;padding:12px 13px;text-align:left;border:1px solid rgba(115,78,55,.12);border-radius:12px;background:rgba(255,255,255,.55);box-shadow:0 8px 20px rgba(80,55,40,.03);}
  .${styles.journeyStep}:last-child{grid-column:auto;max-width:none;margin:0;}
  .${styles.iconWrap}{grid-area:icon;width:46px;height:46px;margin:0;}
  .${styles.iconWrap} img{width:24px;height:24px;}
  .${styles.journeyStep} strong{grid-area:number;margin:0 0 1px;font-size:9px;}
  .${styles.journeyStep} h3{grid-area:title;margin:0 0 2px;font-size:14.5px;line-height:1.18;}
  .${styles.journeyStep} p{grid-area:copy;max-width:none;margin:0;font-size:10.6px;line-height:1.45;}

  .${styles.lessonGrid}{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;}
  .${styles.lessonCard}{border-radius:11px;}
  .${styles.lessonCard}>img{aspect-ratio:1.34/1;}
  .${styles.lessonCard}>div{min-height:96px;padding:9px 9px 10px;}
  .${styles.lessonCard} h3{font-size:12.2px;line-height:1.2;}
  .${styles.lessonCard} p{font-size:10.2px;line-height:1.43;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}

  .${styles.momentsGrid}{display:grid;grid-auto-flow:column;grid-auto-columns:82%;grid-template-columns:none;gap:12px;overflow-x:auto;overflow-y:hidden;padding:1px 0 5px;scroll-snap-type:x mandatory;scrollbar-width:none;-webkit-overflow-scrolling:touch;}
  .${styles.momentsGrid}::-webkit-scrollbar{display:none;}
  .${styles.momentCard}{scroll-snap-align:start;border-radius:12px;}
  .${styles.momentCard}>img{aspect-ratio:1.58/1;}
  .${styles.momentCard} h3{padding:10px 9px 11px;font-size:12px;}

  .pianoStudentStory{grid-template-columns:1fr;border-radius:13px;box-shadow:0 12px 28px rgba(76,48,34,.05);}
  .pianoStudentVideo{aspect-ratio:16/9;min-height:0;}
  .pianoStudentCopy{padding:17px 16px 18px;}
  .pianoStudentMeta{gap:6px;margin-bottom:13px;}
  .pianoStudentMeta span{min-height:25px;padding:0 9px;font-size:8.5px;}
  .pianoStudentSong{margin-bottom:6px!important;font-size:8.4px;}
  .pianoStudentCopy h3{margin-bottom:8px;font-size:23px;}
  .pianoStudentCopy p:not(.pianoStudentSong){margin-bottom:13px;font-size:10.8px;line-height:1.55;}
  .pianoStudentCopy a{font-size:10.4px;}

  .${styles.cta}{min-height:274px;margin:18px 12px 0;border-radius:13px;}
  .${styles.ctaBg}{left:0;right:auto;width:100%;height:100%;object-position:76% 50%;opacity:.34;}
  .${styles.ctaShade}{background:linear-gradient(90deg,rgba(73,10,22,.99),rgba(78,12,23,.95) 58%,rgba(70,10,19,.72));}
  .${styles.ctaCopy}{min-height:274px;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:16px;padding:23px 18px;}
  .${styles.ctaEyebrow}{margin-bottom:6px;font-size:8px;}
  .${styles.ctaCopy} h2{margin-bottom:6px;font-size:29px;line-height:1.04;}
  .${styles.ctaCopy} p{max-width:315px;font-size:10.8px;line-height:1.52;}
  .${styles.ctaActions}{display:grid;grid-template-columns:1fr 1fr;gap:8px;width:100%;max-width:none;}
  .${styles.ctaActions} a{min-height:40px;padding:0 10px;font-size:9.5px;text-align:center;}
  .${styles.ctaActions} a:first-child{grid-column:1/-1;}
  .${styles.ctaActions} .${styles.ctaPrimary}{min-width:0;}
  .${styles.ctaFoliage}{display:none;}

  .${styles.footer}{grid-template-columns:1fr 1fr;gap:18px 16px;padding:26px 16px 54px;}
  .${styles.footer}>div:first-child{grid-column:1/-1;}
  .${styles.footer}>div:nth-child(3),.${styles.footer}>div:nth-child(4){display:flex;}
  .${styles.stay}{display:none!important;}
  .${styles.footer} h4{font-size:11px;}
  .${styles.footer} p,.${styles.footer} a,.${styles.footer} span,.${styles.footer} strong{font-size:9.8px;line-height:1.55;}
  .${styles.footer} small{margin-top:8px;padding-top:12px;font-size:8.8px;}
  .${styles.footerFoliage}{width:96px;right:-26px;bottom:-12px;opacity:.28;}

  .${styles.collectionCard}:hover,.${styles.lessonCard}:hover,.${styles.momentCard}:hover,.${styles.primary}:hover,.${styles.secondary}:hover,.${styles.navCta}:hover{transform:none;}
}

@media (max-width:430px){
  .${styles.hero} h1{font-size:47px;}
  .${styles.heroLead}{font-size:17px;}
  .${styles.collectionGrid},.${styles.momentsGrid}{grid-auto-columns:86%;}
  .${styles.sectionLead} h2{font-size:28px;}
  .${styles.footer}{grid-template-columns:1fr 1fr;}
}
`;

export default function PianoHousePage() {
  return (
    <main className={styles.page}>
      <style>{mobilePolishStyles}</style>
      <PathHeader styles={styles} locale="vi" ariaLabel="Điều hướng PianoHouse" />

      <section className={styles.hero}>
        <img className={styles.heroFoliage} src={FOLIAGE_LEFT} alt="" />
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>PINO House · Âm nhạc</p>
          <h1>PianoHouse</h1>
          <p className={styles.heroLead}>Âm nhạc để biểu đạt. Tự tin theo năm tháng.</p>
          <p className={styles.heroText}>Tại PINO House, trẻ khám phá câu chuyện trong âm nhạc, học cách thể hiện mình qua phím đàn và từng bước tạo nên những khoảnh khắc đáng nhớ.</p>
          <div className={styles.actions}>
            <a className={styles.primary} href="#journey">Khám phá PianoHouse <span>→</span></a>
            <a className={styles.secondary} href="/open-studio">Học thử một buổi <span>→</span></a>
          </div>
        </div>
        <div className={styles.heroImage}>
          <img src={`${ASSET}/girl-playing-grand-piano-at-home.png`} alt="Học viên chơi đại dương cầm trong không gian PianoHouse" />
        </div>
      </section>

      <section className={styles.contentSection} id="collections">
        <div className={styles.sectionLead}>
          <p className={styles.sectionKicker}>Bộ sưu tập</p>
          <h2>Con sẽ chơi gì? <span>✦</span></h2>
          <p>Những tuyển tập được chọn để mở trí tưởng tượng và đưa trẻ bước vào nhiều thế giới âm nhạc khác nhau.</p>
          <a href="#collections">Xem các bộ sưu tập <span>→</span></a>
        </div>
        <div className={styles.collectionGrid}>
          {collections.map(([title, copy, image]) => (
            <article className={styles.collectionCard} key={title}>
              <img src={`${ASSET}/${image}`} alt="" />
              <div><h3>{title}</h3><p>{copy}</p><a href="#journey">Khám phá <span>→</span></a></div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.journeySection} id="journey">
        <div className={styles.sectionLead}>
          <p className={styles.sectionKicker}>Tiến trình</p>
          <h2>Hành trình lớn lên cùng âm nhạc <span>✦</span></h2>
          <p>Một tiến trình rõ ràng để xây năng lực chơi đàn, khả năng biểu đạt và sự tự tin theo thời gian.</p>
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

      <section className={styles.contentSection} id="student-story">
        <div className={styles.sectionLead}>
          <p className={styles.sectionKicker}>Câu chuyện học viên</p>
          <h2>Một bản nhạc. Hai anh em. <span>✦</span></h2>
          <p>Hồng Thiện, 8 tuổi, đang ở trình độ Cấp 5. Với “Nơi này có anh”, Thiện phối hợp cùng anh trai Hồng Nhẫn để tạo nên một phần trình diễn rất riêng.</p>
        </div>
        <article className="pianoStudentStory">
          <div className="pianoStudentVideo">
            <iframe
              src={STUDENT_VIDEO}
              title="Hồng Thiện - Nơi này có anh | PianoHouse"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
          <div className="pianoStudentCopy">
            <div className="pianoStudentMeta">
              <span>8 tuổi</span>
              <span>Cấp 5</span>
              <span>Cùng anh trai</span>
            </div>
            <p className="pianoStudentSong">Nơi này có anh</p>
            <h3>Hồng Thiện × Hồng Nhẫn</h3>
            <p>Thiện trình diễn “Nơi này có anh” và phối hợp cùng anh trai Hồng Nhẫn — một khoảnh khắc để việc học đàn trở thành trải nghiệm âm nhạc được chia sẻ trong gia đình.</p>
            <a href={STUDENT_VIDEO_URL} target="_blank" rel="noreferrer">Xem trên YouTube <span>→</span></a>
          </div>
        </article>
      </section>

      <section className={styles.contentSection} id="lesson">
        <div className={styles.sectionLead}>
          <p className={styles.sectionKicker}>Trải nghiệm học</p>
          <h2>Một buổi học ở PianoHouse <span>✦</span></h2>
          <p>Cấu trúc ấm áp, có nhịp điệu rõ ràng để nuôi dưỡng kỹ năng, sáng tạo và khả năng tự biểu đạt.</p>
          <a href="#journey">Tìm hiểu cách học <span>→</span></a>
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
          <p className={styles.sectionKicker}>Dấu mốc</p>
          <h2>Sân khấu & những khoảnh khắc đáng nhớ <span>✦</span></h2>
          <p>Sân khấu thật, khán giả thật và những dấu mốc giúp trẻ nhìn thấy mình đang lớn lên.</p>
          <a href="/open-studio">Xem hoạt động sắp tới <span>→</span></a>
        </div>
        <div className={styles.momentsGrid}>
          {moments.map(([title, image]) => (
            <article className={styles.momentCard} key={title}>
              <img src={`${ASSET}/${image}`} alt="" />
              <h3>{title}</h3>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.cta}>
        <img className={styles.ctaBg} src={`${ASSET}/grand-piano-in-sunlit-living-room.png`} alt="Không gian PianoHouse trong ánh sáng ấm" />
        <div className={styles.ctaShade} />
        <img className={styles.ctaFoliage} src={FOLIAGE_RIGHT} alt="" />
        <div className={styles.ctaCopy}>
          <div>
            <p className={styles.ctaEyebrow}>Bắt đầu từ một buổi</p>
            <h2>Bắt đầu hành trình PianoHouse</h2>
            <p>Học thử một buổi hoặc ghé Open Studio để tìm điểm bắt đầu phù hợp nhất cho con.</p>
          </div>
          <div className={styles.ctaActions}>
            <a className={styles.ctaPrimary} href="/open-studio">Học thử một buổi <span>→</span></a>
            <a href="#journey">Khám phá PianoHouse <span>→</span></a>
            <a href="/open-studio">Khám phá Open Studio <span>→</span></a>
          </div>
        </div>
      </section>

      <PathFooter styles={styles} locale="vi" />
      <img className={styles.footerFoliage} src={FOLIAGE_RIGHT} alt="" />
    </main>
  );
}
