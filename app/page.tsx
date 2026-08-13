import { HouseArtwork, PrimaryCta, PublicFooter, PublicNav, SectionIntro } from "./components/public-site";

const paths = [
  { age: "3–6", name: "Little Piner Art", note: "Chạm, nhìn, tạo hình và kể chuyện bằng màu sắc.", tone: "coral" },
  { age: "3–6", name: "Little Piner Piano", note: "Làm quen với nhịp điệu, âm thanh và niềm vui chơi nhạc.", tone: "blue" },
  { age: "7+", name: "Art", note: "Phát triển ngôn ngữ thị giác, kỹ thuật và góc nhìn riêng.", tone: "sand" },
  { age: "7+", name: "Piano", note: "Đi từ cảm âm đến biểu đạt và làm chủ tác phẩm.", tone: "lime" },
];

const journeyPoints = [
  ["01", "Lộ trình rõ ràng", "Nội dung được sắp xếp để mỗi trải nghiệm nối tiếp và bồi đắp cho trải nghiệm trước."],
  ["02", "Mentor đồng hành", "Con được quan sát, khích lệ và hỗ trợ đúng lúc — không bị ép vào một khuôn mẫu."],
  ["03", "Dấu vết trưởng thành", "Tác phẩm, buổi trình diễn và portfolio giúp gia đình nhìn thấy hành trình của con."],
  ["04", "Một hệ sinh thái", "Premium mở ra chiều sâu học tập, đặc quyền và những trải nghiệm phong phú hơn tại PINO."],
];

const faqs = [
  ["Open Studio có phải là buổi học thử không?", "Không. Đây là một trải nghiệm khám phá độc lập, nhẹ nhàng và có giá trị riêng — không phải một buổi bán khóa học."],
  ["Con cần biết vẽ hoặc chơi piano trước không?", "Không cần. Open Studio được thiết kế để trẻ bắt đầu bằng tò mò, thử nghiệm và lựa chọn của chính mình."],
  ["Explore và Premium Journey khác nhau thế nào?", "Explore giúp con tự do khám phá PINO qua Open Studio. Premium kết hợp Explore với lộ trình dài hạn, mentor, sự tiến bộ và hệ thống tác phẩm."],
  ["PINO House phù hợp với độ tuổi nào?", "Hiện PINO có bốn lộ trình cho hai nhóm tuổi: Little Piner Art và Piano cho 3–6 tuổi; Art và Piano cho trẻ từ 7 tuổi."],
];

export default function Home() {
  return (
    <main className="homepage">
      <PublicNav />

      <section className="hp-hero shell" aria-labelledby="hero-title">
        <div className="hp-hero-copy">
          <p className="eyebrow">PINO HOUSE · CREATIVE HOME FOR KIDS</p>
          <h1 id="hero-title">Một nơi để con<br /><em>khám phá mình.</em></h1>
          <p className="hp-hero-lede">Nghệ thuật và âm nhạc trở thành cách con quan sát, biểu đạt và lớn lên — theo nhịp điệu của riêng mình.</p>
          <div className="hp-hero-actions">
            <PrimaryCta />
            <a className="text-link" href="#journey">Tìm hiểu Premium Journey <span aria-hidden="true">↓</span></a>
          </div>
          <div className="hp-hero-proof" aria-label="Các trải nghiệm tại PINO">
            <span>ART</span><i>·</i><span>PIANO</span><i>·</i><span>OPEN STUDIO</span>
          </div>
        </div>
        <HouseArtwork />
      </section>

      <section className="hp-belief" id="why-pino">
        <div className="shell hp-belief-grid">
          <p className="eyebrow">VÌ SAO PINO HOUSE</p>
          <h2>Không chỉ học một kỹ năng.<br /><em>Con đang xây một tiếng nói riêng.</em></h2>
          <p>PINO House là nơi trẻ có thời gian để thử, làm lại, theo đuổi một ý tưởng và nhìn thấy mình trưởng thành qua những điều tự tay tạo ra.</p>
        </div>
      </section>

      <section className="hp-model shell" aria-labelledby="model-title">
        <SectionIntro eyebrow="HAI CÁCH ĐỂ ĐỒNG HÀNH" title={<><span id="model-title">Bắt đầu bằng khám phá.</span><br /><em>Đi xa bằng hành trình.</em></>} copy="Không cần quyết định tất cả ngay từ đầu. Gia đình có thể để con khám phá trước, rồi chọn chiều sâu khi con đã tìm thấy điều muốn theo đuổi." />
        <div className="hp-model-grid">
          <article className="hp-model-card hp-model-free">
            <div className="hp-model-label"><span>FREE</span><strong>EXPLORE</strong></div>
            <h3>Open Studio</h3>
            <p>Một điểm vào nhẹ nhàng để con thử điều mới, gặp PINO và quay lại khám phá theo cách không áp lực.</p>
            <PrimaryCta children="Bắt đầu khám phá" />
          </article>
          <article className="hp-model-card hp-model-premium">
            <div className="hp-model-label"><span>PREMIUM</span><strong>JOURNEY + EXPLORE</strong></div>
            <h3>Premium Journey</h3>
            <p>Một hành trình dài hạn có cấu trúc, mentor đồng hành, chiều sâu thực hành và dấu vết tiến bộ rõ ràng.</p>
            <a className="text-link" href="#journey">Xem hành trình Premium <span aria-hidden="true">↓</span></a>
          </article>
        </div>
      </section>

      <section className="hp-paths" id="paths">
        <div className="shell">
          <SectionIntro eyebrow="BỐN LỘ TRÌNH" title={<>Mỗi độ tuổi một nhịp.<br /><em>Mỗi đứa trẻ một hướng đi.</em></>} copy="Bốn lộ trình được xây quanh cách trẻ cảm nhận và phát triển ở từng giai đoạn — trong Art và Piano." />
          <div className="hp-path-grid">
            {paths.map((path, index) => (
              <article className={`hp-path-card hp-path-${path.tone}`} key={path.name}>
                <span className="hp-path-index">0{index + 1}</span>
                <span className="hp-path-age">{path.age} TUỔI</span>
                <div><h3>{path.name}</h3><p>{path.note}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="hp-open-studio" id="open-studio">
        <div className="shell hp-open-grid">
          <div>
            <p className="eyebrow">OPEN STUDIO · EXPLORE</p>
            <h2>Cho con một buổi chiều<br /><em>thật ý nghĩa.</em></h2>
            <p>Không cần chọn lộ trình trước. Con đến để làm, chơi, thử một điều mới và mang về một câu chuyện của riêng mình.</p>
            <PrimaryCta />
          </div>
          <HouseArtwork compact />
        </div>
      </section>

      <section className="hp-journey shell" id="journey">
        <SectionIntro eyebrow="PREMIUM JOURNEY" title={<>Khi con muốn đi sâu hơn,<br /><em>PINO mở ra một hành trình.</em></>} copy="Premium không thay thế tự do khám phá. Premium cho sự tò mò ấy thời gian, cấu trúc và sự đồng hành để trở thành năng lực bền vững." />
        <div className="hp-journey-grid">
          {journeyPoints.map(([number, title, copy]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></article>)}
        </div>
      </section>

      <section className="hp-space">
        <div className="shell hp-space-grid">
          <div className="hp-space-visual" aria-hidden="true"><span>PINO<br /><strong>HOUSE</strong></span><i>✳</i></div>
          <div className="hp-space-copy">
            <p className="eyebrow">KHÔNG GIAN PINO HOUSE</p>
            <h2>Một ngôi nhà để<br /><em>ý tưởng được lớn lên.</em></h2>
            <p>Không gian được tạo ra cho việc quan sát, chạm, nghe, thử và cùng nhau làm nên điều mới. Ấm áp như một ngôi nhà, đủ mở để mỗi đứa trẻ tìm thấy góc của riêng mình.</p>
            <ul><li>Vật liệu và nhạc cụ trong tầm tay</li><li>Nhóm nhỏ, mentor quan sát gần</li><li>Tác phẩm được trân trọng và lưu giữ</li></ul>
          </div>
        </div>
      </section>

      <section className="hp-reassurance shell">
        <SectionIntro eyebrow="DÀNH CHO PHỤ HUYNH" title={<>Nhẹ nhàng để bắt đầu.<br /><em>Đủ sâu để trưởng thành.</em></>} />
        <div className="hp-reassurance-grid">
          <article><strong>Không áp lực chọn sớm</strong><p>Con có thể khám phá trước khi gia đình nghĩ đến một hành trình dài hạn.</p></article>
          <article><strong>Nhìn thấy điều con đang xây</strong><p>Tác phẩm và trải nghiệm tạo nên những dấu mốc cụ thể, không chỉ là một bảng điểm.</p></article>
          <article><strong>Được biết con đang ở đâu</strong><p>Mentor đồng hành và chia sẻ để gia đình hiểu tiến trình, sở thích và bước tiếp theo của con.</p></article>
        </div>
      </section>

      <section className="hp-faq shell" id="faq">
        <SectionIntro eyebrow="CÂU HỎI THƯỜNG GẶP" title={<>Trước khi con<br /><em>bắt đầu khám phá.</em></>} />
        <div className="hp-faq-list">
          {faqs.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}
        </div>
      </section>

      <section className="hp-final">
        <div className="shell hp-final-inner">
          <p className="eyebrow">MỘT BUỔI CHIỀU TẠI PINO</p>
          <h2>Hãy để con bắt đầu<br /><em>bằng sự tò mò.</em></h2>
          <p>Chọn một Open Studio phù hợp và để PINO chuẩn bị phần còn lại.</p>
          <PrimaryCta />
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
