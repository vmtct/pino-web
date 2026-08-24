import ToppiVisual from "../ToppiVisual";

const A = "/visuals/2026-08-24";

const evidence = [
  ["Chủ động mở lời", "Con dám bắt đầu cuộc trò chuyện, không chỉ chờ được hỏi.", `${A}/friendly_child_conversation_card.png`, "👋"],
  ["Duy trì hội thoại", "Con biết hỏi tiếp, nối ý và giữ mạch trò chuyện.", `${A}/playful_blue_chat_bubbles_card.png`, "💬"],
  ["Phản hồi tự nhiên", "Con phản ứng phù hợp ngữ cảnh và bớt phụ thuộc câu mẫu.", `${A}/friendly_green_chat_badge.png`, "↩"],
  ["Diễn đạt ý tưởng", "Con nói rõ hơn điều mình muốn, nghĩ và cảm nhận.", `${A}/golden_star_and_speech_bubble_sticker.png`, "✦"],
] as const;

const methods = [
  ["Speak", "Luyện nói qua tình huống thực tế, thảo luận và trò chuyện tự nhiên.", "💬", "coral"],
  ["Story", "Nghe, hiểu và nói qua câu chuyện, nhân vật và trải nghiệm gần gũi.", "📖", "blue"],
  ["Discover", "Khám phá chủ đề đủ thú vị để trẻ có điều muốn hỏi và kể.", "🔎", "green"],
  ["Make", "Tạo sản phẩm nhỏ, dự án và phần chia sẻ bằng tiếng Anh.", "✂️", "yellow"],
] as const;

const signals = [
  ["Chủ động tham gia hơn", "Con tự bắt đầu, giơ tay, hỏi hoặc nhập cuộc thường xuyên hơn."],
  ["Phản hồi tự nhiên hơn", "Con bớt dừng lâu để dịch và dùng những gì mình biết linh hoạt hơn."],
  ["Biết tiếp nối cuộc trò chuyện", "Con biết hỏi lại, chia sẻ thêm và giữ mạch trao đổi."],
  ["Có nhiều điều muốn kể bằng English hơn", "Con mang câu chuyện, ý tưởng và trải nghiệm ở Toppi về nhà."],
] as const;

export default function CommunicationClassPage() {
  return (
    <main className="tp-site tp-communication-page">
      <header className="tp-nav tp-shell">
        <a className="tp-logo-link" href="/" aria-label="TOPPI trang chủ">
          <ToppiVisual src={`${A}/toppi-by-pino-logo.png`} alt="TOPPI by PINO" className="tp-logo" loading="eager" />
        </a>
        <nav aria-label="Điều hướng chính">
          <a href="/">Về Toppi</a>
          <a href="/#classes" className="is-active">Lớp học</a>
          <a href="/#method">Phương pháp</a>
          <a href="/#families">Dành cho phụ huynh</a>
        </nav>
        <a className="tp-button tp-button-primary tp-nav-cta" href="#trial">Đăng ký trải nghiệm</a>
      </header>

      <section className="tp-class-hero tp-shell">
        <div className="tp-class-hero-copy">
          <span className="tp-kicker">TOPPI ENGLISH CLASS</span>
          <h1>Tự tin<br /><em>giao tiếp</em></h1>
          <p className="tp-lede">Một không gian để con luyện cách mở lời, phản hồi và diễn đạt ý của mình bằng tiếng Anh — qua tương tác thật, câu chuyện và những điều đáng tò mò.</p>
          <div className="tp-actions">
            <a className="tp-button tp-button-primary" href="#trial">Đăng ký trải nghiệm</a>
            <a className="tp-button tp-button-ghost" href="#evidence">Xem Toppi ghi nhận gì</a>
          </div>
          <div className="tp-proof-row"><span>7–10 tuổi</span><span>Nhóm nhỏ</span><span>Trọng tâm ghi nhận: Giao tiếp</span></div>
        </div>
        <div className="tp-class-hero-art">
          <div className="tp-class-swatch" aria-hidden="true" />
          <ToppiVisual src={`${A}/joyful_kids_conversation_cutout.png`} alt="Hai bạn nhỏ đang trò chuyện tự nhiên" className="tp-class-kids" loading="eager" fallback="🗣️" />
          <ToppiVisual src={`${A}/chalky_what_do_you_think_bubble.png`} alt="What do you think?" className="tp-bubble tp-bubble-left" fallback="?" />
          <ToppiVisual src={`${A}/coral_i_think..._speech_bubble_sticker.png`} alt="I think..." className="tp-bubble tp-bubble-right" fallback="…" />
        </div>
      </section>

      <section className="tp-parent-evidence tp-shell" id="evidence">
        <article className="tp-parent-choice">
          <span className="tp-kicker">LỚP NÀY THƯỜNG ĐƯỢC CHỌN KHI…</span>
          <h2>Phụ huynh muốn con<br /><em>dùng tiếng Anh nhiều hơn.</em></h2>
          <ul className="tp-choice-list">
            <li><ToppiVisual src={`${A}/shy_child_s_hesitant_speech_bubble.png`} alt="Con còn ngại nói" className="tp-choice-icon" fallback="🙊" /><span>Con còn ngại nói hoặc chỉ nói khi được hỏi.</span></li>
            <li><ToppiVisual src={`${A}/playful_blue_chat_bubbles_card.png`} alt="Cần nhiều cơ hội trò chuyện" className="tp-choice-icon" fallback="💬" /><span>Con cần nhiều cơ hội để trò chuyện và tương tác bằng tiếng Anh.</span></li>
            <li><ToppiVisual src={`${A}/playful_puzzle_time_together.png`} alt="Học qua tương tác" className="tp-choice-icon" fallback="🧩" /><span>Con hợp với cách học qua câu chuyện, trò chơi và tương tác.</span></li>
          </ul>
        </article>

        <article className="tp-evidence-panel">
          <span className="tp-evidence-tag">TRỌNG TÂM GHI NHẬN</span>
          <h2>Toppi sẽ đặc biệt<br /><em>theo dõi điều gì?</em></h2>
          <div className="tp-evidence-grid">
            {evidence.map(([title, copy, image, fallback]) => (
              <div className="tp-evidence-item" key={title}>
                <ToppiVisual src={image} alt={title} className="tp-evidence-icon" fallback={fallback} />
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
            ))}
          </div>
          <p className="tp-evidence-note">Cả hai lớp cùng học một Toppi journey. Với lớp này, Toppi ưu tiên ghi nhận evidence về giao tiếp.</p>
        </article>
      </section>

      <section className="tp-story-break tp-shell">
        <div className="tp-story-art">
          <ToppiVisual src={`${A}/cheerful_kids_conversation_sticker.png`} alt="Nhóm trẻ cùng trò chuyện và làm một hoạt động" className="tp-story-image" fallback="💬" />
        </div>
        <div className="tp-story-copy">
          <span className="tp-kicker">ENGLISH HAPPENS WHEN…</span>
          <h2>Tiếng Anh xuất hiện<br /><em>khi con có điều muốn nói.</em></h2>
          <p>Toppi không bắt đầu bằng việc ép trẻ nhớ một cấu trúc. Trẻ bắt đầu bằng một câu chuyện, câu hỏi, trò chơi hoặc project đủ thú vị để muốn phản hồi. Sau đó mentor mới giúp con chú ý, luyện và sở hữu ngôn ngữ vừa dùng.</p>
          <div className="tp-mini-rule"><span>Encounter</span><b>→</b><span>Understand</span><b>→</b><span>Use</span><b>→</b><span>Own</span></div>
        </div>
      </section>

      <section className="tp-method tp-method-class">
        <div className="tp-shell">
          <div className="tp-section-heading tp-centered">
            <span className="tp-kicker">Ở TOPPI, CON SẼ THƯỜNG XUYÊN…</span>
            <h2>Đủ cấu trúc để tiến bộ.<br /><em>Đủ tự do để vẫn là một club.</em></h2>
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

      <section className="tp-visible-signals tp-shell">
        <div className="tp-section-heading">
          <span className="tp-kicker">NHỮNG TÍN HIỆU TOPPI GIÚP PHỤ HUYNH NHÌN THẤY</span>
          <h2>Không phải lời hứa cứng.<br /><em>Là những thay đổi có thể quan sát.</em></h2>
        </div>
        <div className="tp-visible-grid">
          {signals.map(([title, copy], index) => (
            <article key={title}>
              <span className="tp-signal-number">0{index + 1}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="tp-fit tp-shell">
        <div className="tp-fit-copy">
          <span className="tp-kicker">LỚP NÀY HỢP VỚI CON NẾU…</span>
          <h2>Một lựa chọn dễ bắt đầu,<br /><em>không cần level test.</em></h2>
        </div>
        <div className="tp-fit-list">
          <span>✓ Con 7–10 tuổi</span>
          <span>✓ Con cần một môi trường để dùng tiếng Anh nhiều hơn</span>
          <span>✓ Con thích học qua câu chuyện, trò chơi và tương tác</span>
        </div>
      </section>

      <section className="tp-final tp-final-coral tp-shell" id="trial">
        <div>
          <span className="tp-kicker">TỰ TIN GIAO TIẾP</span>
          <h2>Cho con một nơi<br /><em>để bắt đầu nói.</em></h2>
          <p>Nếu chưa chắc lớp nào phù hợp, đội ngũ Toppi có thể tư vấn dựa trên điều gia đình đang mong muốn quan sát ở con.</p>
        </div>
        <a className="tp-button tp-button-light tp-final-button" href="mailto:pinostaff2024@gmail.com?subject=TOPPI%20-%20T%E1%BB%B1%20tin%20giao%20ti%E1%BA%BFp">Đăng ký trải nghiệm lớp</a>
      </section>

      <aside className="tp-other-class tp-shell">
        <span>Ưu tiên nền tảng hơn?</span>
        <a href="/#vung-nen">Khám phá lớp <strong>Vững nền ngôn ngữ</strong> →</a>
      </aside>

      <footer className="tp-footer tp-shell">
        <ToppiVisual src={`${A}/toppi-by-pino-logo.png`} alt="TOPPI by PINO" className="tp-footer-logo" />
        <p>Language & Discovery Club · Ages 7–10</p>
        <nav><a href="/">Trang chủ</a><a href="/#classes">Lớp học</a><a href="/#method">Phương pháp</a></nav>
        <a href="https://pinohouse.art">PINO House ↗</a>
      </footer>
    </main>
  );
}
