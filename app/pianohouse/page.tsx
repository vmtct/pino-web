import type { Metadata } from "next";
import styles from "./page.module.css";
import {SongLevels} from "./song-levels";
import {Localized as L} from "../localization";
import {PathIntro} from "../path-intro";
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

export default function PianoHousePage() {
  return (
    <main className={styles.page} data-pino-marketing-page data-path-theme="pianohouse">

      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css" />
      <PathHeader activeHref="/afterschool"/>

      <PathIntro path="pianohouse"/>

      <section className={styles.journeySection} id="journey">
        <div className={styles.sectionLead}>
          <p className={styles.sectionKicker}>Tiến trình</p>
          <h2>Hành trình lớn lên cùng âm nhạc <span>✦</span></h2>
          <p>Một tiến trình rõ ràng để xây năng lực chơi đàn, khả năng biểu đạt và sự tự tin theo thời gian.</p>
        </div>
        <div className={styles.journeyGrid}>
          {journey.map(([number, title, copy], index) => (
            <article className={styles.journeyStep} key={title}>
              <div className={styles.iconWrap}><i className={["fa-solid fa-music","fa-solid fa-sliders","fa-solid fa-hands","fa-solid fa-heart","fa-solid fa-microphone-lines"][index]} aria-hidden="true" /></div>
              <strong>{number}</strong><h3>{title}</h3><p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <SongLevels/>
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

      <section className={styles.startBanner} data-piano-start-banner aria-labelledby="piano-start-title">
        <img className={styles.startPhoto} src="https://assets.pinohouse.art/site/pianohouse/221126/Young%20Pianist%20at%20the%20Glossy%20Piano.png" alt="" loading="lazy"/>
        <div className={styles.startCopy}>
          <p className={styles.startKicker}>PINO · PIANOHOUSE</p>
          <h2 id="piano-start-title"><L vi="Bắt đầu hành trình PianoHouse" en="Begin the PianoHouse journey"/></h2>
          <p><L vi="Cùng PINO tìm bản nhạc đầu tiên và nhịp học phù hợp với con. Ghé Open Studio để khám phá không gian âm nhạc, hoặc đăng ký để được tư vấn." en="Find a first piece and learning rhythm that suit your child. Visit Open Studio to explore our music space, or register your interest for guidance."/></p>
          <div className={styles.startActions}>
            <a href="/afterschool?path=pianohouse#register"><L vi="Đăng ký tư vấn" en="Register interest"/> →</a>
            <a href="/open-studio"><L vi="Xem lịch Open Studio" en="Explore Open Studio"/> →</a>
          </div>
        </div>
      </section>

      <PathFooter/>
      <img className={styles.footerFoliage} src={FOLIAGE_RIGHT} alt="" />
    </main>
  );
}
