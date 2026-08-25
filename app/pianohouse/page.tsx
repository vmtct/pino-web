import type { Metadata } from "next";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "PianoHouse — PINO House",
  description: "Âm nhạc để biểu đạt. Tự tin theo năm tháng. Khám phá PianoHouse tại PINO House.",
};

const ASSET = "https://assets.pinohouse.art/site/pianohouse";
const SIGIL = "https://assets.pinohouse.art/core/Pino%20Sigil.png";
const FOLIAGE_LEFT = "https://assets.pinohouse.art/site/Artchitect/botanical-leaf-illustration.png";
const FOLIAGE_RIGHT = "https://assets.pinohouse.art/site/Artchitect/neutral-botanical-abstract.png";

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

function Brand() {
  return (
    <a className={styles.brand} href="/" aria-label="Trang chủ PINO House">
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
        <nav className={styles.nav} aria-label="Điều hướng PianoHouse">
          <a href="/">Trang chủ</a>
          <a href="/#paths">Hành trình</a>
          <a href="/open-studio">Open Studio</a>
          <a href="/#stories">Câu chuyện</a>
          <a href="/#about">Về PINO</a>
        </nav>
        <a className={styles.navCta} href="/open-studio">Khám phá Open Studio <span>→</span></a>
      </header>

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
        <img className={styles.ctaBg} src={`${ASSET}/front-door.png`} alt="Lối vào PianoHouse trong ánh sáng ấm" />
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

      <footer className={styles.footer}>
        <div><Brand /><p>Nghệ thuật. Âm nhạc. Lớn lên sáng tạo.</p><strong>pinohouse.art</strong></div>
        <div><h4>Khám phá</h4><a href="/">Trang chủ</a><a href="/#paths">Hành trình</a><a href="/open-studio">Open Studio</a><a href="/#stories">Câu chuyện</a></div>
        <div><h4>Về PINO</h4><a href="/#about">Câu chuyện PINO</a><a href="/#about">PINO House</a><a href="/#about">Đội ngũ</a><a href="/#about">Tuyển dụng</a></div>
        <div><h4>Thông tin</h4><a href="/open-studio">Đến thăm</a><a href="/#about">Câu hỏi thường gặp</a><a href="/#about">Chính sách</a><a href="/#about">Liên hệ</a></div>
        <div className={styles.stay}><h4>Kết nối</h4><p>Nhận tin về Open Studio và các hoạt động đặc biệt.</p><span>Instagram · Facebook · YouTube</span></div>
        <small>© {new Date().getFullYear()} PINO House. Đã đăng ký bản quyền.</small>
      </footer>
      <img className={styles.footerFoliage} src={FOLIAGE_RIGHT} alt="" />
    </main>
  );
}
