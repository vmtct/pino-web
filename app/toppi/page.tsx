import ToppiVisual from "./ToppiVisual";

const A = "/visuals/2026-08-24";

const methods = [
  ["Speak", "Trò chuyện, phản xạ và dùng tiếng Anh trong tình huống thật.", "💬", "blue"],
  ["Story", "Khám phá câu chuyện, nhân vật và ý tưởng để ngôn ngữ có ý nghĩa.", "📖", "coral"],
  ["Discover", "Mở rộng thế giới qua chủ đề, nơi chốn và những điều đáng tò mò.", "🌍", "green"],
  ["Make", "Biến ý tưởng thành sản phẩm nhỏ để chia sẻ với bạn bè và gia đình.", "✂️", "yellow"],
] as const;

const signals = [
  ["Chủ động tham gia hơn", "Con bắt đầu nói, hỏi và tham gia hoạt động tự nhiên hơn."],
  ["Phản hồi tự nhiên hơn", "Con bớt phụ thuộc vào câu mẫu và phản hồi linh hoạt hơn."],
  ["Hiểu và dùng từ chắc hơn", "Con gặp lại từ trong nhiều ngữ cảnh và biết cách dùng đúng lúc."],
  ["Có điều để kể", "Con mang câu chuyện, sản phẩm và trải nghiệm Toppi về nhà."],
] as const;

export default function ToppiHome() {
  return (
    <main className="tp-site">
      <header className="tp-nav tp-shell">
        <a className="tp-logo-link" href="/" aria-label="TOPPI trang chủ">
          <ToppiVisual src={`${A}/toppi-by-pino-logo.png`} alt="TOPPI by PINO" className="tp-logo" loading="eager" />
        </a>
        <nav aria-label="Điều hướng chính">
          <a href="#about">Về Toppi</a>
          <a href="#classes">Lớp học</a>
          <a href="#method">Phương pháp</a>
          <a href="#families">Dành cho phụ huynh</a>
        </nav>
        <a className="tp-button tp-button-primary tp-nav-cta" href="#trial">Đăng ký trải nghiệm</a>
      </header>

      <section className="tp-hero tp-shell" id="about">
        <div className="tp-hero-copy">
          <span className="tp-kicker">TOPPI ENGLISH · BY PINO</span>
          <h1>Hello,<br /><em>bigger world.</em></h1>
          <p className="tp-lede">Lớp tiếng Anh cho những đứa trẻ tò mò — học qua câu chuyện, trò chuyện, khám phá và những dự án nhỏ có điều để kể.</p>
          <div className="tp-actions">
            <a className="tp-button tp-button-primary" href="#trial">Đăng ký trải nghiệm</a>
            <a className="tp-button tp-button-ghost" href="#classes">Khám phá lớp học</a>
          </div>
          <div className="tp-proof-row" aria-label="Điểm nổi bật">
            <span>7–10 tuổi</span><span>Nhóm nhỏ</span><span>Learning by using</span>
          </div>
        </div>
        <div className="tp-hero-art" aria-label="Trẻ em khám phá và trò chuyện bằng tiếng Anh">
          <div className="tp-hero-orbit" />
          <ToppiVisual src={`${A}/joyful_kids_conversation_cutout.png`} alt="Hai bạn nhỏ đang trò chuyện" className="tp-hero-kids" loading="eager" fallback="💬" />
          <ToppiVisual src={`${A}/bigger_world_globe_postcard_sticker.png`} alt="Bigger World postcard" className="tp-hero-globe" fallback="🌍" />
          <ToppiVisual src={`${A}/say_it_your_way_sticker.png`} alt="Say it your way" className="tp-hero-sticker" fallback="✦" />
        </div>
      </section>

      <section className="tp-classes tp-shell" id="classes">
        <div className="tp-section-heading tp-centered">
          <span className="tp-kicker">CHỌN LỚP TOPPI</span>
          <h2>Hai lựa chọn dễ hiểu.<br /><em>Một Toppi journey.</em></h2>
          <p>Cả hai lớp cùng trải nghiệm một curriculum. Khác nhau ở điều Toppi đặc biệt quan sát và ghi nhận cho gia đình.</p>
        </div>
        <div className="tp-class-grid">
          <article className="tp-class-card tp-class-communication">
            <div className="tp-class-icon">💬</div>
            <div>
              <span className="tp-card-label">TRỌNG TÂM GIAO TIẾP</span>
              <h3>Tự tin giao tiếp</h3>
              <p>Toppi đặc biệt theo dõi sự chủ động, phản xạ, tương tác và khả năng diễn đạt của con.</p>
              <a className="tp-text-link" href="/tu-tin-giao-tiep">Khám phá lớp <span>→</span></a>
            </div>
          </article>
          <article className="tp-class-card tp-class-foundation" id="vung-nen">
            <div className="tp-class-icon">📚</div>
            <div>
              <span className="tp-card-label">TRỌNG TÂM NỀN TẢNG</span>
              <h3>Vững nền ngôn ngữ</h3>
              <p>Toppi đặc biệt theo dõi cách con hiểu, sử dụng và xây dựng ngôn ngữ ngày càng chắc chắn.</p>
              <span className="tp-text-link tp-coming-soon">Trang chi tiết sắp hoàn thiện</span>
            </div>
          </article>
        </div>
      </section>

      <section className="tp-method" id="method">
        <div className="tp-shell">
          <div className="tp-section-heading">
            <span className="tp-kicker">HOW TOPPI WORKS</span>
            <h2>Ngôn ngữ có ý nghĩa<br /><em>trước khi thành bài học.</em></h2>
          </div>
          <div className="tp-method-grid">
            {methods.map(([title, copy, icon, tone]) => (
              <article className={`tp-method-card tp-tone-${tone}`} key={title}>
                <span className="tp-method-icon">{icon}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="tp-experience tp-shell">
        <div className="tp-experience-art">
          <ToppiVisual src={`${A}/cheerful_kids_conversation_sticker.png`} alt="Trẻ em tương tác trong một hoạt động Toppi" className="tp-experience-image" fallback="🗣️" />
        </div>
        <div className="tp-experience-copy">
          <span className="tp-kicker">MEANING BEFORE MASTERY</span>
          <h2>Tiếng Anh xuất hiện<br /><em>khi con có điều muốn nói.</em></h2>
          <p>Ở Toppi, trẻ gặp tiếng Anh trong những câu chuyện, trò chơi, câu hỏi và dự án đủ thú vị để muốn phản hồi. Khi ngôn ngữ được dùng cho một mục đích thật, việc học trở nên tự nhiên hơn.</p>
          <blockquote>“Use it before you study it.”</blockquote>
        </div>
      </section>

      <section className="tp-signals" id="families">
        <div className="tp-shell">
          <div className="tp-section-heading tp-centered">
            <span className="tp-kicker">PHỤ HUYNH SẼ NHÌN THẤY GÌ?</span>
            <h2>Những tín hiệu nhỏ,<br /><em>nhưng đủ để nhìn thấy hành trình.</em></h2>
          </div>
          <div className="tp-signal-grid">
            {signals.map(([title, copy], index) => (
              <article key={title}>
                <span>0{index + 1}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="tp-club tp-shell">
        <div className="tp-club-card">
          <div className="tp-club-art">
            <ToppiVisual src={`${A}/speak_up_megaphone_club_sticker.png`} alt="Toppi club sticker" className="tp-club-sticker" fallback="📣" />
          </div>
          <div className="tp-club-copy">
            <span className="tp-kicker">INSIDE THE TOPPI CLUB</span>
            <h2>Phụ huynh mua một lớp.<br /><em>Con bước vào một club.</em></h2>
            <p>Class framing giúp gia đình dễ bắt đầu. Bên trong, Toppi vẫn là một Language & Discovery Club: nơi trẻ gặp bạn, khám phá thế giới và có thêm lý do để dùng tiếng Anh.</p>
            <div className="tp-chip-row"><span>Stories</span><span>Discovery</span><span>Creative projects</span><span>Small-group interaction</span></div>
          </div>
        </div>
      </section>

      <section className="tp-final tp-shell" id="trial">
        <div>
          <span className="tp-kicker">HELLO, BIGGER WORLD.</span>
          <h2>Cho con một nơi<br /><em>để bắt đầu nói.</em></h2>
          <p>Toppi dành cho trẻ 7–10 tuổi tại PINO House. Đăng ký để đội ngũ Toppi tư vấn lớp phù hợp với con.</p>
        </div>
        <a className="tp-button tp-button-light tp-final-button" href="mailto:pinostaff2024@gmail.com?subject=TOPPI%20-%20%C4%90%C4%83ng%20k%C3%BD%20tr%E1%BA%A3i%20nghi%E1%BB%87m%20l%E1%BB%9Bp">Đăng ký trải nghiệm lớp</a>
      </section>

      <footer className="tp-footer tp-shell">
        <ToppiVisual src={`${A}/toppi-by-pino-logo.png`} alt="TOPPI by PINO" className="tp-footer-logo" />
        <p>Language & Discovery Club · Ages 7–10</p>
        <nav><a href="#classes">Lớp học</a><a href="#method">Phương pháp</a><a href="#families">Phụ huynh</a></nav>
        <a href="https://pinohouse.art">PINO House ↗</a>
      </footer>
    </main>
  );
}
