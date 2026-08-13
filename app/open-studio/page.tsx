"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { HouseArtwork, PrimaryCta, PublicFooter, PublicNav, SectionIntro } from "../components/public-site";
import "./page.css";

const SCHEDULE_ENDPOINT = "/api/pino-core/open-studio/sessions";
const PINO_TIMEZONE = "Asia/Ho_Chi_Minh";

type CoreSession = {
  id: string;
  path: { id: string; code: string; displayName: string };
  startsAt: string;
  endsAt: string;
  bookingClosesAt: string;
  timezone: string;
  availability: { remainingSeats: number; isFull: boolean };
  access: { kind: "explore" | string; trialPremium: boolean };
};

type ScheduleResponse = { sessions: CoreSession[] };
type ScheduleStatus = "loading" | "success" | "error";

const dateKey = (iso: string) => new Intl.DateTimeFormat("en-CA", {
  timeZone: PINO_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date(iso));

const dateLabel = (iso: string) => {
  const value = new Intl.DateTimeFormat("vi-VN", {
    timeZone: PINO_TIMEZONE,
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(iso));
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const timeLabel = (startsAt: string, endsAt: string) => {
  const formatter = new Intl.DateTimeFormat("vi-VN", {
    timeZone: PINO_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${formatter.format(new Date(startsAt))}–${formatter.format(new Date(endsAt))}`;
};

function isCoreSession(value: unknown): value is CoreSession {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<CoreSession>;
  return typeof session.id === "string"
    && typeof session.path?.displayName === "string"
    && typeof session.startsAt === "string"
    && typeof session.endsAt === "string"
    && typeof session.availability?.remainingSeats === "number"
    && typeof session.availability?.isFull === "boolean";
}

const paths = [
  { age: "3–6 tuổi", name: "Little Piner Art", note: "Màu sắc, vật liệu và đôi tay tò mò." },
  { age: "3–6 tuổi", name: "Little Piner Piano", note: "Âm thanh, nhịp điệu và niềm vui đầu tiên." },
  { age: "7+ tuổi", name: "Art", note: "Quan sát, ý tưởng và ngôn ngữ tạo hình riêng." },
  { age: "7+ tuổi", name: "Piano", note: "Cảm thụ, kỹ thuật và cách kể chuyện bằng âm nhạc." },
];

export default function OpenStudioPage() {
  const [status, setStatus] = useState<ScheduleStatus>("loading");
  const [sessions, setSessions] = useState<CoreSession[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    setStatus("loading");
    try {
      const response = await fetch(SCHEDULE_ENDPOINT, { cache: "no-store", headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`Schedule request failed (${response.status})`);
      const data = await response.json() as ScheduleResponse;
      if (!data || !Array.isArray(data.sessions)) throw new Error("Invalid schedule response");
      setSessions(data.sessions.filter(isCoreSession).sort((a, b) => a.startsAt.localeCompare(b.startsAt)));
      setStatus("success");
    } catch {
      setSessions([]);
      setStatus("error");
    }
  }, []);

  useEffect(() => { void loadSessions(); }, [loadSessions]);

  const groupedSessions = useMemo(() => {
    const groups = new Map<string, CoreSession[]>();
    for (const session of sessions) {
      const key = dateKey(session.startsAt);
      groups.set(key, [...(groups.get(key) || []), session]);
    }
    return Array.from(groups.entries());
  }, [sessions]);

  const selectedSession = sessions.find((session) => session.id === selectedId) || null;

  return (
    <main className="open-studio-page">
      <PublicNav />

      <section className="os-hero shell" aria-labelledby="open-studio-title">
        <div className="os-hero-copy">
          <p className="eyebrow">PINO HOUSE · OPEN STUDIO</p>
          <h1 id="open-studio-title">Cho con một buổi chiều <em>ý nghĩa.</em></h1>
          <p className="os-lead">Một khoảng thời gian nhẹ nhàng để con chạm vào nghệ thuật, âm nhạc và tìm điều mình thật sự muốn khám phá.</p>
          <div className="os-hero-actions">
            <PrimaryCta href="#sessions">Xem lịch Open Studio</PrimaryCta>
            <a className="os-text-link" href="#what-is">Open Studio là gì? <span aria-hidden="true">↓</span></a>
          </div>
          <p className="os-soft-note"><span aria-hidden="true">✳</span> Không áp lực · Không phải buổi học thử bán hàng</p>
        </div>
        <HouseArtwork />
      </section>

      <section className="os-purpose shell" id="what-is" aria-labelledby="purpose-title">
        <SectionIntro
          id="purpose-title"
          eyebrow="01 · OPEN STUDIO LÀ GÌ?"
          title={<>Một cánh cửa mở vào <em>thế giới của con.</em></>}
          copy="Open Studio là buổi trải nghiệm miễn phí, nơi trẻ được tự do quan sát, thử làm và trò chuyện cùng mentor trong không gian PINO House."
        />
        <div className="os-purpose-grid" id="why-pino">
          <article><span>01</span><h3>Đến để khám phá</h3><p>Không cần biết trước, không cần làm giống ai. Con bắt đầu bằng sự tò mò của chính mình.</p></article>
          <article><span>02</span><h3>Được người lớn lắng nghe</h3><p>Mentor quan sát cách con phản ứng, đặt câu hỏi và tạo ra — thay vì chỉ chấm một kết quả.</p></article>
          <article><span>03</span><h3>Ra về với một dấu ấn</h3><p>Một trải nghiệm, một câu chuyện hoặc một tác phẩm nhỏ để cả nhà cùng tiếp tục trò chuyện.</p></article>
        </div>
      </section>

      <section className="os-paths" id="paths" aria-labelledby="paths-title">
        <div className="shell">
          <SectionIntro
            id="paths-title"
            eyebrow="02 · DÀNH CHO AI?"
            title={<>Bốn lối vào, <em>một ngôi nhà.</em></>}
            copy="Chọn theo độ tuổi và điều con muốn thử. Không cần quyết định một lộ trình dài ngay hôm nay."
          />
          <div className="os-path-grid">
            {paths.map((path, index) => <article key={path.name}>
              <div><span>{String(index + 1).padStart(2, "0")}</span><small>{path.age}</small></div>
              <h3>{path.name}</h3><p>{path.note}</p>
            </article>)}
          </div>
        </div>
      </section>

      <section className="os-model shell" id="journey" aria-labelledby="model-title">
        <SectionIntro id="model-title" eyebrow="03 · EXPLORE & JOURNEY" title={<>Bắt đầu nhẹ nhàng. <em>Đi xa khi sẵn sàng.</em></>} />
        <div className="os-model-grid">
          <article className="os-model-card os-model-explore">
            <p className="eyebrow">FREE · EXPLORE</p><h3>Open Studio</h3>
            <p>Những lần ghé PINO để khám phá chủ đề, chất liệu và trải nghiệm mới — không ràng buộc.</p>
            <ul><li>Một buổi chiều có chủ đích</li><li>Không gian và mentor PINO</li><li>Tự do thử điều con tò mò</li></ul>
          </article>
          <article className="os-model-card os-model-journey">
            <p className="eyebrow">PREMIUM · JOURNEY + EXPLORE</p><h3>Premium Journey</h3>
            <p>Một hành trình học tập có cấu trúc cho gia đình muốn con đi sâu và trưởng thành bền vững.</p>
            <ul><li>Lộ trình và tiến trình rõ ràng</li><li>Mentor đồng hành sâu hơn</li><li>Tác phẩm, portfolio và đặc quyền PINO</li></ul>
          </article>
        </div>
      </section>

      <section className="os-schedule" id="sessions" aria-labelledby="sessions-title">
        <div className="shell">
          <SectionIntro
            id="sessions-title"
            eyebrow="04 · LỊCH SẮP TỚI"
            title={<>Chọn một buổi <em>phù hợp với con.</em></>}
            copy="Giờ hiển thị theo múi giờ Việt Nam. Chọn buổi chỉ để đánh dấu lựa chọn; chưa gửi đăng ký ở bước này."
          />

          <div className="os-schedule-panel" aria-live="polite" aria-busy={status === "loading"}>
            {status === "loading" ? <div className="os-state os-loading">
              <span className="os-spinner" aria-hidden="true" /><div><strong>Đang mở lịch Open Studio…</strong><p>PINO đang tìm những buổi gần nhất cho gia đình.</p></div>
            </div> : null}

            {status === "error" ? <div className="os-state os-error-state">
              <span aria-hidden="true">↻</span><div><strong>Lịch đang tạm nghỉ một chút.</strong><p>Phần còn lại của Open Studio vẫn ở đây. Bạn có thể thử lại hoặc liên hệ PINO để hỏi lịch gần nhất.</p>
              <button type="button" onClick={() => void loadSessions()}>Thử tải lại</button></div>
            </div> : null}

            {status === "success" && groupedSessions.length === 0 ? <div className="os-state os-empty-state">
              <span aria-hidden="true">✳</span><div><strong>Lịch mới đang được chuẩn bị.</strong><p>Chưa có buổi Open Studio sắp tới. Hãy quay lại sau hoặc nhắn PINO để được báo khi lịch mở.</p></div>
            </div> : null}

            {status === "success" && groupedSessions.length > 0 ? <div className="os-day-list">
              {groupedSessions.map(([key, daySessions]) => <section className="os-day" key={key} aria-labelledby={`day-${key}`}>
                <h3 id={`day-${key}`}>{dateLabel(daySessions[0].startsAt)}</h3>
                <div className="os-session-list">
                  {daySessions.map((session) => {
                    const isFull = session.availability.isFull || session.availability.remainingSeats <= 0;
                    const selected = selectedId === session.id;
                    return <article className={`os-session${selected ? " is-selected" : ""}${isFull ? " is-full" : ""}`} key={session.id}>
                      <div className="os-session-time"><span>{timeLabel(session.startsAt, session.endsAt)}</span><small>Giờ Việt Nam</small></div>
                      <div className="os-session-path"><small>PATH</small><strong>{session.path.displayName}</strong></div>
                      <div className={`os-seats${isFull ? " is-full" : ""}`}><span aria-hidden="true" />{isFull ? "Đã đủ chỗ" : `Còn ${session.availability.remainingSeats} chỗ`}</div>
                      <button type="button" disabled={isFull} aria-pressed={selected} onClick={() => setSelectedId(session.id)}>{isFull ? "Đã đủ chỗ" : selected ? "Đã chọn" : "Chọn buổi này"}</button>
                    </article>;
                  })}
                </div>
              </section>)}
            </div> : null}
          </div>

          {selectedSession ? <div className="os-selection" role="status">
            <span aria-hidden="true">✓</span><div><strong>Đã chọn {selectedSession.path.displayName} · {dateLabel(selectedSession.startsAt)}, {timeLabel(selectedSession.startsAt, selectedSession.endsAt)}</strong>
            <p>Ở bước tiếp theo, phụ huynh sẽ điền thông tin để PINO giữ chỗ. Form đăng ký chưa được mở trong phiên bản này.</p></div>
          </div> : null}
        </div>
      </section>

      <section className="os-next shell" aria-labelledby="next-title">
        <SectionIntro id="next-title" eyebrow="05 · SAU KHI CHỌN BUỔI" title={<>Ba bước đơn giản, <em>không áp lực.</em></>} />
        <ol>
          <li><span>01</span><div><h3>Chọn buổi phù hợp</h3><p>Xem ngày, giờ, lộ trình và số chỗ còn lại ngay trên lịch.</p></div></li>
          <li><span>02</span><div><h3>Để lại thông tin</h3><p>Khi luồng đăng ký mở, phụ huynh chỉ cần cung cấp thông tin cần thiết để giữ chỗ.</p></div></li>
          <li><span>03</span><div><h3>Cùng con đến PINO</h3><p>PINO sẽ xác nhận trước buổi trải nghiệm để gia đình biết cần chuẩn bị gì.</p></div></li>
        </ol>
      </section>

      <section className="os-final shell" aria-labelledby="final-title">
        <div><p className="eyebrow">MỘT BUỔI CHIỀU CÓ THỂ MỞ RA MỘT HÀNH TRÌNH</p><h2 id="final-title">Hãy để con bắt đầu bằng <em>sự tò mò.</em></h2>
        <p>Open Studio là lời mời khám phá. Premium Journey chỉ bắt đầu khi gia đình và con thực sự muốn đi sâu hơn.</p><PrimaryCta href="#sessions">Xem lịch Open Studio</PrimaryCta></div>
        <HouseArtwork compact />
      </section>

      <PublicFooter />
    </main>
  );
}
