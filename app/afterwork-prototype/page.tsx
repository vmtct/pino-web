"use client";

import { useMemo, useState } from "react";
import { acrylicCollections, type AcrylicOffering } from "./catalog";
import "./page.css";

type Kind = "acrylic" | "piano";
type BookingStep = "details" | "holding" | "confirmed";
type Session = {
  id: string;
  kind: Kind;
  title: string;
  collection: string;
  day: string;
  date: string;
  time: string;
  duration: string;
  price: string;
  seatsLeft: number;
  capacity: number;
  mood: string;
  art: string;
};

const sessions: Session[] = [
  { id: "aw-a-01", kind: "acrylic", title: "Sunday Flowers", collection: "Slow Living", day: "Saturday", date: "22 Aug", time: "14:30", duration: "150 min", price: "250k", seatsLeft: 4, capacity: 8, mood: "warm · soft · slow", art: "flowers" },
  { id: "aw-a-02", kind: "acrylic", title: "Rainy Window", collection: "After Rain", day: "Sunday", date: "23 Aug", time: "14:30", duration: "150 min", price: "250k", seatsLeft: 2, capacity: 8, mood: "quiet · rainy · cinematic", art: "rain" },
  { id: "aw-p-01", kind: "piano", title: "Always With Me", collection: "Ghibli Collection", day: "Saturday", date: "22 Aug", time: "19:00", duration: "90 min", price: "from 250k", seatsLeft: 3, capacity: 5, mood: "gentle · nostalgic", art: "ghibli" },
  { id: "aw-p-02", kind: "piano", title: "Kiss The Rain", collection: "Rainy Piano", day: "Sunday", date: "23 Aug", time: "19:00", duration: "90 min", price: "from 250k", seatsLeft: 1, capacity: 5, mood: "calm · introspective", art: "piano-rain" },
];

const pianoCollections = [
  ["Ghibli Collection", "Always With Me · One Summer’s Day · Merry-Go-Round", "ghibli"],
  ["Rainy Piano", "Kiss The Rain · River Flows in You · Comptine", "piano-rain"],
  ["Cinema Piano", "Interstellar · La La Land · Nuvole Bianche", "cinema"],
];

export default function AfterworkPrototypePage() {
  const [selected, setSelected] = useState<Session | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<AcrylicOffering | null>(null);
  const [party, setParty] = useState("Just me");
  const [bookingStep, setBookingStep] = useState<BookingStep>("details");
  const acrylic = useMemo(() => sessions.filter((s) => s.kind === "acrylic"), []);
  const piano = useMemo(() => sessions.filter((s) => s.kind === "piano"), []);

  function openBooking(session: Session) {
    setSelectedOffer(null);
    setBookingStep("details");
    setParty("Just me");
    setSelected(session);
  }

  function closeBooking() {
    setSelected(null);
    setBookingStep("details");
  }

  function activeSessionFor(title: string) {
    return sessions.find((session) => session.kind === "acrylic" && session.title === title) ?? null;
  }

  return (
    <main className="afterwork-page">
      <header className="aw-nav">
        <a className="aw-brand" href="#top">PINO <span>AFTERWORK</span></a>
        <nav><a href="#weekend">This weekend</a><a href="#acrylic">Acrylic</a><a href="#piano">Piano Spa</a></nav>
        <a className="aw-nav-cta" href="#weekend">Book a pause</a>
      </header>

      <section className="aw-hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">A weekend creative retreat for grown-ups</p>
          <h1>Your weekend deserves<br /><em>a beautiful pause.</em></h1>
          <p className="hero-lead">Một buổi chiều để vẽ. Một buổi tối để chơi bản nhạc mình yêu. Không áp lực, không cần kinh nghiệm — chỉ cần đến và chậm lại.</p>
          <div className="hero-actions"><a className="primary" href="#weekend">Explore this weekend</a><a className="text-link" href="#experience">How it feels ↓</a></div>
        </div>
        <div className="hero-scene" aria-label="Acrylic afternoon flowing into piano evening">
          <div className="sun-orb" />
          <div className="paint-card"><span>Acrylic Afternoon</span><strong>Paint something beautiful.</strong><i /></div>
          <div className="piano-card"><span>Piano Spa</span><strong>Play something you love.</strong><div className="keys" /></div>
        </div>
      </section>

      <section className="weekend" id="weekend">
        <div className="section-heading"><div><p className="eyebrow">22–23 August · Cần Thơ</p><h2>This weekend</h2></div><p>Chọn cảm giác bạn muốn mang về cuối tuần này.</p></div>
        <div className="weekend-grid">
          <SessionColumn title="Paint the afternoon" subtitle="Acrylic · 14:30" sessions={acrylic} onBook={openBooking} />
          <SessionColumn title="Play the evening" subtitle="Piano Spa · 19:00" sessions={piano} onBook={openBooking} />
        </div>
      </section>

      <section className="split-story" id="experience">
        <div className="story-card daylight"><p className="eyebrow">Acrylic Afternoon</p><h2>Pick. Paint. Take it home.</h2><p>Không phải lớp mỹ thuật. Bạn chọn một mẫu/chủ đề mình thích, facilitator chia bức tranh thành những bước dễ theo, và cuối buổi bạn mang về một canvas hoàn chỉnh.</p><div className="ritual"><span>Arrive</span><b>→</b><span>Settle</span><b>→</b><span>Paint</span><b>→</b><span>Take home</span></div></div>
        <div className="story-card night"><p className="eyebrow">Piano Spa</p><h2>Your song, from the first night.</h2><p>Không solfège, không thi cử. Giáo trình được reverse-engineer từ chính nhạc phẩm bạn chọn để ngay session đầu đã tạo được một musical outcome thật.</p><div className="ritual"><span>Listen</span><b>→</b><span>Play</span><b>→</b><span>Feel</span><b>→</b><span>Release</span></div></div>
      </section>

      <section className="catalog-section" id="acrylic">
        <div className="section-heading"><div><p className="eyebrow">Acrylic collections · 16 paintings</p><h2>Choose a world to paint.</h2></div><p>Catalog là thư viện cảm xúc. Mỗi cuối tuần PINO chỉ curate một số painting thành session thật.</p></div>
        <div className="acrylic-catalog">{acrylicCollections.map((collection) => <section className="collection-block" key={collection.slug}>
          <div className="collection-intro"><p className="eyebrow">{collection.title}</p><h3>{collection.promise}</h3><p>{collection.description}</p></div>
          <div className="offering-grid">{collection.offerings.map((offering) => {
            const active = activeSessionFor(offering.title);
            return <button className="offering-card" key={offering.slug} onClick={() => setSelectedOffer(offering)}>
              <span className="offering-visual" style={{ background: offering.visual }}><i>{active ? `${active.day} · ${active.time}` : "Catalog"}</i></span>
              <span className="offering-copy"><small>{offering.mood}</small><strong>{offering.title}</strong><em>{active ? `${active.seatsLeft} seats left this weekend` : "Open detail"}</em></span>
            </button>;
          })}</div>
        </section>)}</div>
      </section>

      <section className="catalog-section piano-section" id="piano">
        <div className="section-heading"><div><p className="eyebrow">Piano collections</p><h2>Choose the song you already love.</h2></div><p>Mỗi nhạc phẩm là một journey; hoàn thành trọn vẹn để release record của chính mình.</p></div>
        <div className="collection-grid piano-grid">{pianoCollections.map(([title, desc, art]) => <article key={title} className="collection-card record-card"><div className={`collection-art ${art}`}><i className="vinyl" /></div><p>{title}</p><span>{desc}</span></article>)}</div>
        <div className="reward-strip"><div><small>01</small><strong>Melody</strong></div><b>→</b><div><small>02</small><strong>Two hands</strong></div><b>→</b><div><small>03</small><strong>Expression</strong></div><b>→</b><div><small>04</small><strong>Vinyl + NFC release</strong></div></div>
      </section>

      <section className="adult-first">
        <p className="eyebrow">Adult-first, family-welcome</p>
        <h2>This is your experience too.</h2>
        <p>Đi một mình, cùng người yêu, bạn bè — hoặc mang bé theo ở những session family-friendly. Người lớn luôn là participant, không phải người đi kèm.</p>
      </section>

      <footer><span>PINO AFTERWORK · prototype v0.2</span><span>Destination: afterwork.pinohouse.art</span></footer>

      {selectedOffer && <div className="booking-backdrop" role="presentation" onMouseDown={() => setSelectedOffer(null)}>
        <section className="booking-sheet offering-sheet" role="dialog" aria-modal="true" aria-label={selectedOffer.title} onMouseDown={(e) => e.stopPropagation()}>
          <button className="close" onClick={() => setSelectedOffer(null)} aria-label="Close">×</button>
          <div className="detail-visual" style={{ background: selectedOffer.visual }} />
          <p className="eyebrow">{selectedOffer.collection} · Acrylic Afternoon</p>
          <h2>{selectedOffer.title}</h2>
          <p className="detail-story">{selectedOffer.story}</p>
          <div className="detail-facts"><span><small>Mood</small>{selectedOffer.mood}</span><span><small>Experience</small>{selectedOffer.difficulty}</span><span><small>Time</small>{selectedOffer.duration}</span><span><small>Family</small>{selectedOffer.familyFriendly ? "Family-friendly" : "Adult-focused"}</span></div>
          <p className="detail-note">{selectedOffer.canvas}. Materials included in the experience; exact production spec remains prototype-only.</p>
          {activeSessionFor(selectedOffer.title) ? <button className="confirm" onClick={() => openBooking(activeSessionFor(selectedOffer.title)!)}>Book this weekend</button> : <a className="detail-back" href="#weekend" onClick={() => setSelectedOffer(null)}>Not scheduled this weekend · see what is open ↑</a>}
          <small className="prototype-note">Offering detail is product evidence only — no canonical catalog state exists yet.</small>
        </section>
      </div>}

      {selected && (
        <div className="booking-backdrop" role="presentation" onMouseDown={closeBooking}>
          <section className="booking-sheet" role="dialog" aria-modal="true" aria-label={`Book ${selected.title}`} onMouseDown={(e) => e.stopPropagation()}>
            <button className="close" onClick={closeBooking} aria-label="Close">×</button>

            {bookingStep === "details" && <>
              <p className="eyebrow">{selected.kind === "acrylic" ? "Acrylic Afternoon" : "Piano Spa"}</p>
              <h2>{selected.title}</h2>
              <div className="booking-meta"><span>{selected.day} · {selected.date}</span><span>{selected.time} · {selected.duration}</span><span>{selected.price} / guest</span><span>Light deposit required to confirm</span></div>
              <label>Who’s coming?</label>
              <div className="party-options">{["Just me", "Two adults", "Family"].map((option) => <button key={option} className={party === option ? "active" : ""} onClick={() => setParty(option)}>{option}</button>)}</div>
              <label>Your name<input placeholder="Tên của bạn" /></label>
              <label>Phone<input inputMode="tel" placeholder="Số điện thoại / Zalo" /></label>
              {party === "Family" && <label>Family note<input placeholder="Ví dụ: 1 người lớn + bé 9 tuổi" /></label>}
              <button className="confirm" onClick={() => setBookingStep("holding")}>Hold my seat</button>
              <small className="prototype-note">Prototype only — this does not create a Core booking.</small>
            </>}

            {bookingStep === "holding" && <div className="success">
              <span>◷</span>
              <p className="eyebrow">Booking status · HOLDING</p>
              <h2>Your seat is held.</h2>
              <p>Chỗ của bạn đang được giữ tạm thời. Booking chỉ được xác nhận sau khi PINO nhận được khoản deposit yêu cầu.</p>
              <div className="booking-meta"><span>{selected.title}</span><span>{selected.day} · {selected.date} · {selected.time}</span><span>Deposit amount: resolved by session terms</span><span>Hold expiry: policy still TBD</span></div>
              <button className="confirm" onClick={() => setBookingStep("confirmed")}>Simulate deposit confirmed</button>
              <small className="prototype-note">No payment provider is connected. This button only demonstrates lifecycle.</small>
            </div>}

            {bookingStep === "confirmed" && <div className="success">
              <span>✓</span>
              <p className="eyebrow">Booking status · CONFIRMED</p>
              <h2>Your pause is confirmed.</h2>
              <p>Deposit verified. Chỗ của bạn đã được xác nhận cho session này.</p>
              <div className="booking-meta"><span>{selected.title}</span><span>{selected.day} · {selected.date} · {selected.time}</span><span>Prototype booking ref · AW-DEMO-001</span></div>
              <button className="confirm" onClick={closeBooking}>Done</button>
              <small className="prototype-note">Prototype state only — no booking or payment is persisted.</small>
            </div>}
          </section>
        </div>
      )}
    </main>
  );
}

function SessionColumn({ title, subtitle, sessions, onBook }: { title: string; subtitle: string; sessions: Session[]; onBook: (s: Session) => void }) {
  return <div className="session-column"><div className="column-title"><div><small>{subtitle}</small><h3>{title}</h3></div><span>{sessions.length} sessions</span></div>{sessions.map((session) => <article className="session-card" key={session.id}><div className={`session-art ${session.art}`}><span>{session.collection}</span></div><div className="session-body"><div><p>{session.day} · {session.date}</p><h4>{session.title}</h4><small>{session.mood}</small></div><div className="session-bottom"><div><strong>{session.time}</strong><span>{session.duration} · {session.price}</span></div><button onClick={() => onBook(session)}>Book · {session.seatsLeft} left</button></div></div></article>)}</div>;
}
