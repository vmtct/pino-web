"use client";

import { useMemo, useState } from "react";
import { PINER_DESTINATIONS, PINER_PROTOTYPE_HOUSEHOLD, type PinerDestination } from "../../lib/piner-space-contract";
import styles from "./piner-space.module.css";

export default function PinerSpace() {
  const [studentId, setStudentId] = useState(PINER_PROTOTYPE_HOUSEHOLD.students[0]?.student.id ?? "");
  const [destination, setDestination] = useState<PinerDestination>("home");
  const scene = useMemo(
    () => PINER_PROTOTYPE_HOUSEHOLD.students.find((item) => item.student.id === studentId) ?? PINER_PROTOTYPE_HOUSEHOLD.students[0],
    [studentId],
  );

  if (!scene) return <main className={styles.page}><div className={styles.emptySafe}>Không có Student context để hiển thị. Piner fail closed thay vì ghép dữ liệu từ context khác.</div></main>;

  return (
    <main className={styles.page}>
      <aside className={styles.rail}>
        <div className={styles.brand}>PINO<span className={styles.brandDot}>•</span></div>
        <section className={styles.household} aria-label="Household student context">
          <div className={styles.eyebrow}>Piner Space</div>
          <div className={styles.householdTitle}>{PINER_PROTOTYPE_HOUSEHOLD.parentLabel}</div>
          <div className={styles.studentSwitch}>
            {PINER_PROTOTYPE_HOUSEHOLD.students.map((item) => {
              const active = item.student.id === scene.student.id;
              return (
                <button
                  type="button"
                  key={item.student.id}
                  className={`${styles.studentButton} ${active ? styles.studentButtonActive : ""}`}
                  aria-pressed={active}
                  onClick={() => setStudentId(item.student.id)}
                >
                  <span className={styles.avatar}>{item.student.avatarText}</span>
                  <span>{item.student.displayName}</span>
                </button>
              );
            })}
          </div>
        </section>
        <nav className={styles.nav} aria-label="Piner primary navigation">
          {PINER_DESTINATIONS.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`${styles.navButton} ${destination === item.id ? styles.navButtonActive : ""}`}
              aria-current={destination === item.id ? "page" : undefined}
              onClick={() => setDestination(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className={styles.railFooter}>
          <strong>Prototype contract</strong><br />Student switching is presentation-only here. Protected reads/writes will re-authorize Parent → Student on the server.
        </div>
      </aside>

      <section className={styles.main}>
        <header className={styles.topbar}>
          <div>
            <div className={styles.eyebrow}>ACTIVE STUDENT</div>
            <strong>{scene.student.displayName}</strong>
          </div>
          <div className={styles.topbarMeta}>Parent context · one Student at a time</div>
          <div className={styles.prototypePill}>Fixture · not canonical truth</div>
        </header>
        {destination === "home" && <Home scene={scene} go={setDestination} />}
        {destination === "journey" && <Journey scene={scene} />}
        {destination === "collection" && <Collection scene={scene} />}
        {destination === "explore" && <Explore scene={scene} />}
      </section>
    </main>
  );
}

type Scene = (typeof PINER_PROTOTYPE_HOUSEHOLD.students)[number];

function Home({ scene, go }: { scene: Scene; go: (destination: PinerDestination) => void }) {
  return <>
    <div className={styles.hero}>
      <section className={styles.heroLead}>
        <div>
          <div className={styles.eyebrow}>TRANG CHỦ</div>
          <h1>{scene.home.greeting}</h1>
        </div>
        <p>Trang chủ là một scene hướng hành động: giúp gia đình hiểu điều đáng chú ý tiếp theo, thay vì biến Piner thành dashboard quản trị.</p>
      </section>
      <aside className={styles.actionCard}>
        <div>
          <div className={styles.eyebrow}>{scene.home.nextAction.eyebrow}</div>
          <h2>{scene.home.nextAction.title}</h2>
          <p>{scene.home.nextAction.detail}</p>
        </div>
        <button className={styles.actionButton} type="button" onClick={() => go("journey")}>{scene.home.nextAction.cta} →</button>
      </aside>
    </div>

    <section className={styles.section}>
      <div className={styles.sectionHeader}><h2>Gia đình cần biết gì?</h2><p>Membership chỉ là presentation trong Student context; không trở thành primary destination.</p></div>
      <div className={styles.grid2}>
        <article className={`${styles.card} ${styles.membershipCard}`}><div className={styles.eyebrow}>MEMBERSHIP</div><div className={styles.membershipLabel}>{scene.home.membership.label}</div><p>{scene.home.membership.detail}</p></article>
        <article className={styles.card}><div className={styles.eyebrow}>SẮP TỚI</div><h3>{scene.home.upcoming[0]?.title ?? "Chưa có hoạt động sắp tới"}</h3><p>{scene.home.upcoming[0] ? `${scene.home.upcoming[0].when} · ${scene.home.upcoming[0].place}` : "Empty state không tự suy diễn lịch học."}</p></article>
      </div>
    </section>

    <section className={styles.section}>
      <div className={styles.sectionHeader}><h2>Lịch gần nhất</h2><p>Fixture để kiểm layout; production sẽ đọc canonical occurrence/session state.</p></div>
      <div className={styles.grid3}>{scene.home.upcoming.map((item) => <article className={styles.card} key={item.id}><div className={styles.eyebrow}>{item.when}</div><h3>{item.title}</h3><p>{item.place}</p></article>)}</div>
    </section>
  </>;
}

function Journey({ scene }: { scene: Scene }) {
  return <>
    <div className={styles.focusBand}><div className={styles.eyebrow}>HÀNH TRÌNH</div><h2>{scene.journey.pathTitle}</h2><p>{scene.journey.pathNote}</p></div>
    <section className={styles.section}>
      <div className={styles.sectionHeader}><h2>Đang tập trung</h2><p>{scene.journey.currentFocus}</p></div>
      <div className={styles.timeline}>{scene.journey.moments.map((moment) => <div className={styles.moment} key={moment.id}><span className={`${styles.dot} ${styles[moment.state]}`} /><div><strong>{moment.title}</strong><span>{moment.note}</span></div></div>)}</div>
    </section>
  </>;
}

function Collection({ scene }: { scene: Scene }) {
  return <>
    <div className={styles.focusBand}><div className={styles.eyebrow}>THÀNH QUẢ</div><h2>{scene.collection.headline}</h2><p>Durable learner-facing outcomes — không phải raw Evidence feed hay staff review state.</p></div>
    <div className={styles.grid3}>{scene.collection.items.map((item) => <article className={`${styles.card} ${styles.collectionCard}`} key={item.id}><div className={styles.collectionKind}>{item.kind}</div><div><h3>{item.title}</h3><p>{item.note}</p></div></article>)}</div>
  </>;
}

function Explore({ scene }: { scene: Scene }) {
  return <>
    <div className={styles.focusBand}><div className={styles.eyebrow}>KHÁM PHÁ</div><h2>{scene.explore.intro}</h2><p>UI không quyết định eligibility, age-fit, capacity, Booking hay entitlement. Những quyết định đó sẽ đến từ Core.</p></div>
    <div className={styles.grid2}>{scene.explore.items.map((item) => <article className={`${styles.card} ${styles.exploreCard}`} key={item.id}><span className={styles.label}>{item.label}</span><h3>{item.title}</h3><p className={styles.exploreMeta}>{item.meta}</p><p>{item.note}</p><div className={styles.disabledCta}>Booking action chưa bật · chờ canonical runtime contract</div></article>)}</div>
  </>;
}
