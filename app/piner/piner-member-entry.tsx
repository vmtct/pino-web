"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  parseHomeProjection,
  parseJourneyProjection,
  parseOwnerOpenStudioAdmission,
  parseParentSession,
  parseStudentList,
  projectionResponseIsCurrent,
} from "../../lib/piner-member-projections";
import type {
  HomePrimaryAction,
  MemberHomeProjection,
  MemberJourneyProjection,
  PinerParentSession,
  PinerStudentSummary,
} from "../../lib/piner-member-projections";
import styles from "./piner.module.css";

type ViewState = "loading" | "signed-out" | "change-pin" | "ready" | "unavailable";
type Destination = "home" | "journey" | "collection" | "explore";
type ApiEnvelope<T> = { data?: T; error?: { code?: string; message?: string } };
type ProjectionResult<T> =
  | { kind: "ok"; data: T }
  | { kind: "auth" }
  | { kind: "aborted" }
  | { kind: "error"; message: string };

const PINER_ICON_BASE = "https://assets.pinohouse.art/site/shared/piner-space-icon-";

function PinerIcon({ name, className }: { name: string; className?: string }) {
  return <img className={className} src={`${PINER_ICON_BASE}${name}.svg`} alt="" aria-hidden="true" />;
}

function pathIcon(label: string) {
  if (/ArtChitect/i.test(label)) return "path-artchitect";
  if (/Little Piner Art/i.test(label)) return "path-little-piner-art";
  if (/Little Piner Piano/i.test(label)) return "path-little-piner-piano";
  return "path-pianohouse";
}

function displayMockLabel(value: string) {
  const marked = /^PINO_PROD_E2E_SYNTHETIC_DO_NOT_CONTACT/i.test(value);
  let next = value.replace(/^PINO_PROD_E2E_SYNTHETIC_DO_NOT_CONTACT\s*[·-]?\s*/i, "");
  next = next.replace(/\s+JOURNEY$/i, "").replace(/\s+EXPLORE$/i, "").trim();
  return marked && !/\smock$/i.test(next) ? `${next} mock` : next;
}

export default function PinerMemberEntry() {
  const [view, setView] = useState<ViewState>("loading");
  const [session, setSession] = useState<PinerParentSession | null>(null);
  const [students, setStudents] = useState<PinerStudentSummary[]>([]);
  const [activeStudentId, setActiveStudentId] = useState("");
  const [destination, setDestination] = useState<Destination>("home");
  const [studentPickerOpen, setStudentPickerOpen] = useState(false);
  const [error, setError] = useState("");
  const [home, setHome] = useState<MemberHomeProjection | null>(null);
  const [journey, setJourney] = useState<MemberJourneyProjection | null>(null);
  const [homeError, setHomeError] = useState("");
  const [journeyError, setJourneyError] = useState("");
  const [projectionLoading, setProjectionLoading] = useState(false);
  const [projectionRefreshKey, setProjectionRefreshKey] = useState(0);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const projectionVersion = useRef(0);
  const projectionAbort = useRef<AbortController | null>(null);
  const activeStudentRef = useRef("");
  const actionReplayRef = useRef<{ signature: string; key: string } | null>(null);
  activeStudentRef.current = activeStudentId;

  useEffect(() => {
    void restoreSession();
  }, []);

  const activeStudent = useMemo(
    () => students.find((student) => student.id === activeStudentId) ?? students[0] ?? null,
    [students, activeStudentId],
  );
  const visibleHome = home?.student.id === activeStudentId ? home : null;
  const visibleJourney = journey?.student.id === activeStudentId ? journey : null;

  useEffect(() => {
    if (view !== "ready" || !activeStudentId) return;

    const requestedStudentId = activeStudentId;
    const version = ++projectionVersion.current;
    projectionAbort.current?.abort();
    const controller = new AbortController();
    projectionAbort.current = controller;
    setProjectionLoading(true);
    setHome(null);
    setJourney(null);
    setHomeError("");
    setJourneyError("");

    void Promise.all([
      readHomeProjection(requestedStudentId, controller.signal),
      readJourneyProjection(requestedStudentId, controller.signal),
    ]).then(([homeResult, journeyResult]) => {
      if (controller.signal.aborted || version !== projectionVersion.current) return;
      if (homeResult.kind === "auth" || journeyResult.kind === "auth") {
        clearMemberContext();
        setView("signed-out");
        return;
      }
      applyHomeResult(homeResult, requestedStudentId, version);
      applyJourneyResult(journeyResult, requestedStudentId, version);
      setProjectionLoading(false);
    });

    return () => controller.abort();
  }, [activeStudentId, view, projectionRefreshKey]);

  function applyHomeResult(result: ProjectionResult<MemberHomeProjection>, studentId: string, version: number) {
    if (result.kind === "aborted") return;
    if (result.kind === "error") {
      setHomeError(result.message);
      return;
    }
    if (result.kind !== "ok") return;
    if (!projectionResponseIsCurrent(
      studentId,
      result.data.student.id,
      activeStudentRef.current,
      version,
      projectionVersion.current,
    )) return;
    setHome(result.data);
  }

  function applyJourneyResult(result: ProjectionResult<MemberJourneyProjection>, studentId: string, version: number) {
    if (result.kind === "aborted") return;
    if (result.kind === "error") {
      setJourneyError(result.message);
      return;
    }
    if (result.kind !== "ok") return;
    if (!projectionResponseIsCurrent(
      studentId,
      result.data.student.id,
      activeStudentRef.current,
      version,
      projectionVersion.current,
    )) return;
    setJourney(result.data);
  }

  async function restoreSession() {
    setView("loading");
    setError("");
    try {
      const response = await fetch("/api/piner/session", { cache: "no-store" });
      if (response.status === 401) {
        clearMemberContext();
        setView("signed-out");
        return;
      }
      if (!response.ok) {
        setView("unavailable");
        setError(await apiMessage(response, "Piner tạm thời chưa sẵn sàng."));
        return;
      }
      const envelope = await response.json() as ApiEnvelope<unknown>;
      const canonicalSession = parseParentSession(envelope.data);
      if (!canonicalSession) throw new Error("Invalid member session payload");
      setSession(canonicalSession);
      await loadStudents();
    } catch {
      setView("unavailable");
      setError("Piner tạm thời chưa sẵn sàng. Vui lòng thử lại sau.");
    }
  }

  async function loadStudents() {
    const response = await fetch("/api/piner/students", { cache: "no-store" });
    if (response.status === 401) {
      clearMemberContext();
      setView("signed-out");
      return;
    }
    if (!response.ok) throw new Error(await apiMessage(response, "Không thể tải Piner của gia đình."));
    const envelope = await response.json() as ApiEnvelope<unknown>;
    const canonicalStudents = parseStudentList(envelope.data);
    if (!canonicalStudents) throw new Error("Invalid Student list payload");
    setStudents(canonicalStudents);
    setActiveStudentId(canonicalStudents[0]?.id ?? "");
    setDestination("home");
    setView("ready");
  }

  async function login(phone: string, pin: string) {
    setError("");
    const response = await fetch("/api/piner/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifierType: "PHONE", identifierValue: phone.trim(), pin }),
    });
    const envelope = await response.json().catch(() => ({})) as ApiEnvelope<{ authState?: string }>;
    if (!response.ok) {
      setError(envelope.error?.message || "Số điện thoại hoặc PIN chưa đúng.");
      return;
    }
    if (envelope.data?.authState === "PIN_CHANGE_REQUIRED") {
      setView("change-pin");
      return;
    }
    if (envelope.data?.authState === "AUTHENTICATED") {
      await restoreSession();
      return;
    }
    setError("Piner chưa thể hoàn tất đăng nhập.");
  }

  async function changePin(newPin: string) {
    setError("");
    const response = await fetch("/api/piner/auth/change-pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPin }),
    });
    const envelope = await response.json().catch(() => ({})) as ApiEnvelope<{ authState?: string }>;
    if (!response.ok) {
      setError(envelope.error?.message || "Chưa thể đổi PIN.");
      return;
    }
    if (envelope.data?.authState === "AUTHENTICATED") {
      await restoreSession();
      return;
    }
    setError("Piner chưa thể hoàn tất đổi PIN.");
  }

  async function admitOwnerOpenStudio(action: HomePrimaryAction) {
    if (action.kind !== "EXPLORE_RETURN" || action.target.kind !== "OPEN_STUDIO" || !activeStudentId) return;
    const target = action.target;
    const signature = `${activeStudentId}:${target.passId}:${target.listingId}:OWNER`;
    const replay = actionReplayRef.current?.signature === signature
      ? actionReplayRef.current
      : { signature, key: crypto.randomUUID() };
    actionReplayRef.current = replay;
    setActionBusy(true);
    setActionError("");
    try {
      const response = await fetch(`/api/piner/students/${activeStudentId}/open-studio/admissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": replay.key,
        },
        body: JSON.stringify({ passId: target.passId, listingId: target.listingId, participantMode: "OWNER" }),
      });
      if (response.status === 401) {
        clearMemberContext();
        setView("signed-out");
        return;
      }
      if (!response.ok) {
        if (response.status < 500) actionReplayRef.current = null;
        setActionError(await apiMessage(response, "Chưa thể giữ chỗ Open Studio."));
        return;
      }
      const envelope = await response.json() as ApiEnvelope<unknown>;
      const admitted = parseOwnerOpenStudioAdmission(envelope.data, target.listingId, target.sessionId);
      if (!admitted) {
        setActionError("Open Studio đã phản hồi nhưng dữ liệu chưa hợp lệ. Piner đang đồng bộ lại từ Core.");
      }
      setProjectionRefreshKey((value) => value + 1);
    } catch {
      setActionError("Chưa thể giữ chỗ Open Studio. Bạn có thể thử lại mà không tạo yêu cầu trùng.");
    } finally {
      setActionBusy(false);
    }
  }
  async function logout() {
    setError("");
    const response = await fetch("/api/piner/logout", {
      method: "POST",
      headers: { "Idempotency-Key": crypto.randomUUID() },
    });
    if (!response.ok && response.status !== 401) {
      setError(await apiMessage(response, "Chưa thể đăng xuất."));
      return;
    }
    clearMemberContext();
    setView("signed-out");
  }

  function clearMemberContext() {
    projectionAbort.current?.abort();
    projectionVersion.current += 1;
    setSession(null);
    setStudents([]);
    setActiveStudentId("");
    setHome(null);
    setJourney(null);
    setHomeError("");
    setJourneyError("");
    setProjectionLoading(false);
    setActionBusy(false);
    setActionError("");
    setStudentPickerOpen(false);
    actionReplayRef.current = null;
  }

  function selectStudent(studentId: string) {
    if (studentId === activeStudentId) { setStudentPickerOpen(false); return; }
    projectionAbort.current?.abort();
    projectionVersion.current += 1;
    actionReplayRef.current = null;
    setActionError("");
    setHome(null);
    setJourney(null);
    setHomeError("");
    setJourneyError("");
    setProjectionLoading(true);
    setDestination("home");
    setActiveStudentId(studentId);
    setStudentPickerOpen(false);
  }

  if (view === "loading") return <Loading />;
  if (view === "signed-out") return <AuthCard onSubmit={login} error={error} />;
  if (view === "change-pin") return <ChangePinCard onSubmit={changePin} error={error} />;
  if (view === "unavailable") return <Unavailable message={error} onRetry={() => void restoreSession()} />;

  return (
    <main className={styles.prototype}>
      <section className={styles.deviceStage}>
        <div className={styles.device}>
          <header className={styles.appHeader}>
            <button type="button" className={styles.studentButton} onClick={() => setStudentPickerOpen(true)} aria-label="Đổi Piner">
              <span className={styles.avatar}>{initials(activeStudent?.displayName || "P")}</span>
              <span className={styles.studentMeta}>
                <strong>{displayMockLabel(activeStudent?.displayName || "Piner")}</strong>
                <small>{home?.journey?.pathDisplayName || "Piner Space"}</small>
              </span>
              <span className={styles.chevron}><PinerIcon name="chevron-down" /></span>
            </button>
            <span className={styles.wordmark}>PINO</span>
          </header>

          <div className={styles.screen}>
            {activeStudent ? (
              <section className={styles.surface} aria-live="polite">
                {destination === "home" ? (
                  <HomeSurface
                    student={activeStudent}
                    home={visibleHome}
                    loading={projectionLoading}
                    error={homeError}
                    onDestination={setDestination}
                    onOpenStudioAdmission={admitOwnerOpenStudio}
                    actionBusy={actionBusy}
                    actionError={actionError}
                  />
                ) : null}
                {destination === "journey" ? (
                  <JourneySurface student={activeStudent} journey={visibleJourney} loading={projectionLoading} error={journeyError} />
                ) : null}
                {destination === "collection" ? <CollectionSurface student={activeStudent} /> : null}
                {destination === "explore" ? (
                  <ExploreSurface
                    student={activeStudent}
                    home={visibleHome}
                    onOpenStudioAdmission={admitOwnerOpenStudio}
                    actionBusy={actionBusy}
                    actionError={actionError}
                  />
                ) : null}
              </section>
            ) : (
              <div className={styles.emptyState}>
                <strong>Chưa có Piner được liên kết.</strong>
                <span>Vui lòng liên hệ PINO House để kiểm tra hồ sơ gia đình.</span>
              </div>
            )}
          </div>

          <nav className={styles.bottomNav} aria-label="Không gian Piner">
            <DestinationButton icon="nav-home" active={destination === "home"} onClick={() => setDestination("home")}>Trang chủ</DestinationButton>
            <DestinationButton icon="nav-journey" active={destination === "journey"} onClick={() => setDestination("journey")}>Hành trình</DestinationButton>
            <DestinationButton icon="nav-outcomes" active={destination === "collection"} onClick={() => setDestination("collection")}>Thành quả</DestinationButton>
            <DestinationButton icon="nav-explore" active={destination === "explore"} onClick={() => setDestination("explore")}>Khám phá</DestinationButton>
          </nav>
          {studentPickerOpen ? (
            <div className={styles.overlayBackdrop} onMouseDown={() => setStudentPickerOpen(false)}>
              <div className={styles.sheet} onMouseDown={(event) => event.stopPropagation()}>
                <div className={styles.sheetHandle} />
                <div className={styles.sheetTitleRow}>
                  <div><span className={styles.eyebrow}>GIA ĐÌNH PINO</span><h3>Chọn Piner</h3></div>
                  <button type="button" className={styles.iconButton} onClick={() => setStudentPickerOpen(false)} aria-label="Đóng"><PinerIcon name="close" /></button>
                </div>
                <div className={styles.studentList}>
                  {students.map((student) => {
                    const selected = student.id === activeStudent?.id;
                    return (
                      <button type="button" key={student.id} onClick={() => selectStudent(student.id)} aria-pressed={selected}>
                        <span className={styles.avatar}>{initials(student.displayName)}</span>
                        <span><strong>{displayMockLabel(student.displayName)}</strong><small>{selected ? "Đang xem" : "Chuyển sang hồ sơ này"}</small></span>
                        <em className={styles.studentStateIcon}><PinerIcon name={selected ? "check" : "arrow-right"} /></em>
                      </button>
                    );
                  })}
                </div>
                <div className={styles.householdActions}>
                  <button type="button" onClick={() => void logout()}><span>{session?.parent.displayName || "Gia đình PINO"}</span><strong>Đăng xuất <PinerIcon name="arrow-right" /></strong></button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function DestinationButton({ icon, active, onClick, children }: { icon: string; active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className={active ? styles.navActive : ""} onClick={onClick} aria-pressed={active}>
      <span className={styles.navIcon}><PinerIcon name={icon} /></span><small>{children}</small>
    </button>
  );
}


function HomeSurface({
  student,
  home,
  loading,
  error,
  onDestination,
  onOpenStudioAdmission,
  actionBusy,
  actionError,
}: {
  student: PinerStudentSummary;
  home: MemberHomeProjection | null;
  loading: boolean;
  error: string;
  onDestination: (destination: Destination) => void;
  onOpenStudioAdmission: (action: HomePrimaryAction) => Promise<void>;
  actionBusy: boolean;
  actionError: string;
}) {
  if (loading && !home) return <SurfaceLoading label="Đang mở không gian của con…" />;
  if (!home) return <SurfaceError title="Trang chủ chưa thể tải." message={error || "Piner chưa nhận được dữ liệu mới nhất."} />;

  const action = home.primaryAction;
  const copy = action ? primaryActionCopy(action, home) : { title: "Hôm nay chưa có việc cần ưu tiên.", note: "Con có thể quay lại bất cứ lúc nào để tiếp tục hành trình." };
  const eyebrow = action?.kind === "PHYSICAL_TOUCHPOINT" ? "SẮP ĐẾN PINO" : action?.kind === "EXPLORE_RETURN" ? "KHÁM PHÁ" : action?.kind === "CONTINUE_JOURNEY" ? "TIẾP TỤC HÀNH TRÌNH" : "PINER SPACE";

  return (
    <div className={styles.stack}>
      <section className={`${styles.heroCard} ${home.state === "DEGRADED" ? styles.heroMuted : ""}`}>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <h2>{copy.title}</h2>
        <p>{copy.note}</p>
        {action?.kind === "CONTINUE_JOURNEY" ? <button className={styles.primaryButton} type="button" onClick={() => onDestination("journey")}>Tiếp tục luyện <span className={styles.buttonIcon}><PinerIcon name="arrow-right" /></span></button> : null}
        {action?.kind === "EXPLORE_RETURN" && action.target.kind === "OPEN_STUDIO" ? <button className={styles.primaryButton} type="button" disabled={actionBusy} onClick={() => void onOpenStudioAdmission(action)}>{actionBusy ? "Đang giữ chỗ…" : "Giữ chỗ Open Studio →"}</button> : null}
        {action?.kind === "PHYSICAL_TOUCHPOINT" ? <button className={styles.primaryButton} type="button" onClick={() => onDestination("home")}>Xem buổi hôm nay <span className={styles.buttonIcon}><PinerIcon name="arrow-right" /></span></button> : null}
        {actionError ? <div className={styles.heroError}>{actionError}</div> : null}
      </section>
      {home.journey ? (
        <section className={styles.sectionBlock}>
          <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>TỔNG QUAN HÀNH TRÌNH</span><h3>Con đang ở đâu?</h3></div></div>
          <button type="button" className={styles.glanceCard} onClick={() => onDestination("journey")}>
            <span className={styles.pathMark}><PinerIcon name={pathIcon(home.journey.pathDisplayName)} /></span>
            <span className={styles.glanceCopy}><strong>{displayMockLabel(home.journey.focusLabel)}</strong><small>{home.journey.pathDisplayName}{home.journey.currentMilestoneLabel ? ` · ${home.journey.currentMilestoneLabel}` : ""}</small></span>
            <span className={styles.arrow}><PinerIcon name="arrow-right" /></span>
          </button>
        </section>
      ) : null}

      <section className={styles.returnCard}>
        <span className={styles.returnIcon}><PinerIcon name={home.journey ? pathIcon(home.journey.pathDisplayName) : "nav-explore"} /></span>
        <div>
          <span className={styles.eyebrow}>QUAY LẠI PINO</span>
          <h3>{home.nextTouchpoint ? formatDateTime(home.nextTouchpoint.scheduledStartsAt) : "Khám phá một buổi phù hợp"}</h3>
          <p>{home.nextTouchpoint ? `Kết thúc lúc ${formatTime(home.nextTouchpoint.scheduledEndsAt)}` : "Open Studio và những trải nghiệm mới đang chờ con."}</p>
        </div>
        <button type="button" className={styles.circleButton} onClick={() => onDestination(home.nextTouchpoint ? "home" : "explore")} aria-label="Mở"><PinerIcon name="arrow-right" /></button>
      </section>
    </div>
  );
}

function PrimaryActionCard({
  action,
  home,
  onDestination,
  onOpenStudioAdmission,
  actionBusy,
  actionError,
}: {
  action: HomePrimaryAction | null;
  home: MemberHomeProjection;
  onDestination: (destination: Destination) => void;
  onOpenStudioAdmission: (action: HomePrimaryAction) => Promise<void>;
  actionBusy: boolean;
  actionError: string;
}) {
  if (!action) {
    return (
      <article className={`${styles.surfaceCard} ${styles.primaryActionCard}`}>
        <p className={styles.eyebrow}>NEXT ACTION</p>
        <h3>Không có việc cần ưu tiên lúc này.</h3>
        <p>Core trả về {home.state}; Piner giữ nguyên trạng thái đó.</p>
        <span className={styles.canonicalBadge}>Canonical neutral</span>
      </article>
    );
  }

  const copy = primaryActionCopy(action, home);
  return (
    <article className={`${styles.surfaceCard} ${styles.primaryActionCard}`}>
      <p className={styles.eyebrow}>NEXT ACTION · {action.kind}</p>
      <h3>{copy.title}</h3>
      <p>{copy.note}</p>
      {action.kind === "CONTINUE_JOURNEY" ? (
        <button className={styles.actionButton} type="button" onClick={() => onDestination("journey")}>Mở Hành trình →</button>
      ) : null}
      {action.kind === "EXPLORE_RETURN" && action.target.kind === "OPEN_STUDIO" ? (
        <button className={styles.actionButton} type="button" disabled={actionBusy} onClick={() => void onOpenStudioAdmission(action)}>
          {actionBusy ? "Đang giữ chỗ…" : "Giữ chỗ Open Studio →"}
        </button>
      ) : null}
      {actionError ? <div className={styles.error}>{actionError}</div> : null}
      {action.kind !== "CONTINUE_JOURNEY" && action.kind !== "EXPLORE_RETURN" ? (
        <span className={styles.pending}>Action target đã được Core xác định</span>
      ) : null}
    </article>
  );
}

function primaryActionCopy(action: HomePrimaryAction, home: MemberHomeProjection): { title: string; note: string } {
  switch (action.kind) {
    case "CONTINUE_JOURNEY":
      return { title: home.journey?.focusLabel ? displayMockLabel(home.journey.focusLabel) : "Tiếp tục Hành trình", note: home.journey?.currentMilestoneLabel || "Bài đang học đã sẵn sàng để con tiếp tục." };
    case "PHYSICAL_TOUCHPOINT":
      return { title: "Buổi học sắp tới", note: home.nextTouchpoint ? formatDateTime(home.nextTouchpoint.scheduledStartsAt) : "Một điểm hẹn tại PINO đang đến gần." };
    case "EXPLORE_RETURN":
      return { title: "Một buổi Khám Phá đang mở", note: "Chọn một trải nghiệm Open Studio phù hợp để quay lại PINO." };
    case "VIEW_RETAINED_VALUE":
      return { title: "Những gì con đã làm vẫn ở đây", note: "Mở lại nội dung và thành quả đã được giữ trong Hành trình." };
    case "VIEW_FRESH_OUTCOME":
      return { title: "Có thành quả mới", note: "Một điều mới vừa được thêm vào không gian của con." };
    case "RECOVERY":
      return { title: "Piner đang đồng bộ lại", note: "Một phần thông tin cần được cập nhật trước khi tiếp tục." };
  }
}
function JourneySurface({ student, journey, loading, error }: { student: PinerStudentSummary; journey: MemberJourneyProjection | null; loading: boolean; error: string }) {
  if (loading && !journey) return <SurfaceLoading label="Đang mở Hành trình…" />;
  if (!journey) return <SurfaceError title="Hành trình chưa thể tải." message={error || "Piner chưa nhận được Hành trình mới nhất."} />;

  const unsupported = journey.paths.filter((path) => path.support === "UNSUPPORTED");
  return (
    <div className={styles.stack}>
      <div className={styles.pageTitle}>
        <span className={styles.eyebrow}>HÀNH TRÌNH</span>
        <h2>Hành trình của {displayMockLabel(student.displayName)}</h2>
        <p>Mỗi chương trình giữ một mạch tiến bộ riêng của con.</p>
      </div>

      {journey.state === "NO_ACTIVE_JOURNEY" ? (
        <section className={styles.aspirationCard}>
          <span className={styles.eyebrow}>BẮT ĐẦU HÀNH TRÌNH</span>
          <h3>Hành trình sẽ hiện khi con bắt đầu một chương trình tại PINO.</h3>
          <p>Trong lúc này, Khám phá vẫn luôn mở để gia đình tìm một trải nghiệm phù hợp.</p>
        </section>
      ) : null}

      {journey.journeys.map((item) => {
        const total = Math.max(1, Math.min(item.progress.totalMilestoneCount, 10));
        const achieved = Math.min(item.progress.achievedMilestoneCount, total);
        return (
          <section className={styles.journeyHero} key={item.journeyId}>
            <span className={styles.eyebrow}>{item.path.displayName}</span>
            <div className={styles.journeyHeroRow}>
              <div><h3>{displayMockLabel(item.focus.label)}</h3><p>{item.progress.currentMilestone?.label || "Đang tiếp tục theo nhịp của con"}</p></div>
              <span className={styles.bigGlyph}><PinerIcon name={pathIcon(item.path.displayName)} /></span>
            </div>
            <div className={styles.levelLadder} aria-label={`${achieved} trên ${total} cột mốc`}>
              {Array.from({ length: total }, (_, index) => {
                const level = index + 1;
                const done = level <= achieved;
                const current = level === Math.min(achieved + 1, total);
                return <div key={level} className={`${styles.levelNode} ${done ? styles.levelDone : ""} ${current ? styles.levelCurrent : ""}`}><strong>L{level}</strong><small className={styles.levelState}>{done ? <PinerIcon name="check" /> : current ? <PinerIcon name="current" /> : <PinerIcon name="pending" />}</small></div>;
              })}
            </div>
            {item.lastRecognizedAt ? <p className={styles.footnote}>Ghi nhận gần nhất · {formatDateTime(item.lastRecognizedAt)}</p> : null}
          </section>
        );
      })}
      {unsupported.length > 0 ? (
        <section className={styles.noticeCard}>
          <span className={styles.eyebrow}>SẮP MỞ</span>
          <h3>Một chương trình đang được nối vào Piner Space.</h3>
          <p>{unsupported.map((path) => path.path.displayName).join(" · ")}</p>
        </section>
      ) : null}
    </div>
  );
}

function CollectionSurface({ student }: { student: PinerStudentSummary }) {
  return (
    <div className={styles.stack}>
      <div className={styles.pageTitle}>
        <span className={styles.eyebrow}>THÀNH QUẢ</span>
        <h2>Những điều {displayMockLabel(student.displayName)} đã làm.</h2>
        <p>Tác phẩm, bản ghi và cột mốc được giữ lại theo thời gian.</p>
      </div>
      <section className={styles.collectionEmpty}>
        <span className={styles.collectionGlyph}><PinerIcon name="media-artwork" /></span>
        <strong>Thành quả đầu tiên sẽ xuất hiện ở đây.</strong>
        <p>Khi PINO ghi nhận một tác phẩm, bản ghi hoặc cột mốc, gia đình sẽ có thể mở lại từ Piner Space.</p>
      </section>
      <section className={styles.collectionDoctrine}>
        <span className={styles.eyebrow}>LUÔN THUỘC VỀ CON</span>
        <h3>Quyền truy cập có thể kết thúc. Thành quả vẫn còn.</h3>
      </section>
    </div>
  );
}

function ExploreSurface({ student, home, onOpenStudioAdmission, actionBusy, actionError }: {
  student: PinerStudentSummary;
  home: MemberHomeProjection | null;
  onOpenStudioAdmission: (action: HomePrimaryAction) => Promise<void>;
  actionBusy: boolean;
  actionError: string;
}) {
  const action = home?.primaryAction;
  const bookable = action?.kind === "EXPLORE_RETURN" && action.target.kind === "OPEN_STUDIO";
  return (
    <div className={styles.stack}>
      <div className={styles.pageTitle}>
        <span className={styles.eyebrow}>KHÁM PHÁ</span>
        <h2>Một lý do để {displayMockLabel(student.displayName)} quay lại PINO.</h2>
        <p>Open Studio và những trải nghiệm ngoài Hành trình chính được gom tại đây.</p>
      </div>
      <section className={`${styles.eligibilityCard} ${bookable ? "" : styles.eligibilityBlocked}`}>
        <span className={styles.eyebrow}>{bookable ? "ĐANG KHẢ DỤNG" : "OPEN STUDIO"}</span>
        <h3>{bookable ? "Một buổi Khám Phá đang chờ con." : "Chưa có buổi mới phù hợp lúc này."}</h3>
        <p>{bookable ? "Piner đã kiểm tra quyền tham gia hiện tại của hồ sơ này." : "Khi có hoạt động phù hợp, Piner sẽ đưa nó lên đây."}</p>
        {bookable ? <button className={styles.primaryButton} type="button" disabled={actionBusy} onClick={() => void onOpenStudioAdmission(action)}>{actionBusy ? "Đang giữ chỗ…" : "Đăng ký buổi này →"}</button> : null}
        {actionError ? <div className={styles.error}>{actionError}</div> : null}
      </section>
      <section className={styles.premiumDiscoveryCard}>
        <span className={styles.eyebrow}>KHÁM PHÁ THÊM</span>
        <h3>Những lần ghé PINO có thể nối thành một Hành trình dài hạn.</h3>
        <p>Gia đình vẫn có thể bắt đầu từ một buổi Khám Phá và tiếp tục khi tìm thấy chương trình phù hợp.</p>
      </section>
    </div>
  );
}

function SurfaceLoading({ label }: { label: string }) {
  return <div className={styles.surfaceLoading}><span className={styles.loader} /><strong>{label}</strong></div>;
}

function SurfaceError({ title, message }: { title: string; message: string }) {
  return <div className={styles.emptyPanel}><strong>{title}</strong><span>{message}</span></div>;
}

function AuthCard({ onSubmit, error }: { onSubmit: (phone: string, pin: string) => Promise<void>; error: string }) {
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!phone.trim() || !/^\d{6}$/.test(pin)) return;
    setBusy(true);
    try { await onSubmit(phone, pin); } finally { setBusy(false); }
  }

  return (
    <AuthFrame eyebrow="PINER SPACE" title="Một nơi để theo dõi hành trình của con." note="Dùng số điện thoại đã đăng ký với PINO và PIN 6 số của gia đình.">
      <form className={styles.form} onSubmit={submit}>
        <label>Số điện thoại<input autoComplete="tel" inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="09xx xxx xxx" /></label>
        <label>PIN 6 số<input autoComplete="current-password" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="••••••" type="password" /></label>
        {error ? <div className={styles.error}>{error}</div> : null}
        <button className={styles.primaryButton} disabled={busy || !phone.trim() || pin.length !== 6}>{busy ? "Đang mở Piner…" : "Vào Piner"}</button>
      </form>
    </AuthFrame>
  );
}

function ChangePinCard({ onSubmit, error }: { onSubmit: (pin: string) => Promise<void>; error: string }) {
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const valid = /^\d{6}$/.test(pin) && pin === confirm;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!valid) return;
    setBusy(true);
    try { await onSubmit(pin); } finally { setBusy(false); }
  }

  return (
    <AuthFrame eyebrow="BƯỚC ĐẦU TIÊN" title="Tạo PIN riêng cho gia đình." note="PIN tạm chỉ dùng một lần. Hãy đặt PIN 6 số mới trước khi vào Piner.">
      <form className={styles.form} onSubmit={submit}>
        <label>PIN mới<input autoComplete="new-password" inputMode="numeric" maxLength={6} value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 6))} type="password" placeholder="6 số" /></label>
        <label>Nhập lại PIN<input autoComplete="new-password" inputMode="numeric" maxLength={6} value={confirm} onChange={(event) => setConfirm(event.target.value.replace(/\D/g, "").slice(0, 6))} type="password" placeholder="6 số" /></label>
        {confirm && pin !== confirm ? <div className={styles.error}>Hai PIN chưa trùng nhau.</div> : null}
        {error ? <div className={styles.error}>{error}</div> : null}
        <button className={styles.primaryButton} disabled={busy || !valid}>{busy ? "Đang lưu…" : "Lưu PIN & vào Piner"}</button>
      </form>
    </AuthFrame>
  );
}

function AuthFrame({ eyebrow, title, note, children }: { eyebrow: string; title: string; note: string; children: ReactNode }) {
  return <main className={styles.authPage}><section className={styles.authCard}><a className={styles.brand} href="/">PINO<span>•</span></a><div><p className={styles.eyebrow}>{eyebrow}</p><h1>{title}</h1><p>{note}</p></div>{children}<small className={styles.securityNote}>Phiên đăng nhập được giữ trong cookie bảo mật; PIN và session token không được lưu trong localStorage.</small></section></main>;
}

function Loading() {
  return <main className={styles.authPage}><section className={styles.loadingCard}><span className={styles.loader} /><strong>Đang mở Piner…</strong></section></main>;
}

function Unavailable({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <main className={styles.authPage}><section className={styles.authCard}><a className={styles.brand} href="/">PINO<span>•</span></a><div><p className={styles.eyebrow}>PINER SPACE</p><h1>Tạm thời chưa sẵn sàng.</h1><p>{message}</p></div><button className={styles.primaryButton} onClick={onRetry}>Thử lại</button></section></main>;
}

async function readHomeProjection(studentId: string, signal: AbortSignal): Promise<ProjectionResult<MemberHomeProjection>> {
  return readProjection(`/api/piner/students/${studentId}/home`, studentId, signal, parseHomeProjection, "Trang chủ");
}

async function readJourneyProjection(studentId: string, signal: AbortSignal): Promise<ProjectionResult<MemberJourneyProjection>> {
  return readProjection(`/api/piner/students/${studentId}/journey`, studentId, signal, parseJourneyProjection, "Hành trình");
}

async function readProjection<T>(
  path: string,
  studentId: string,
  signal: AbortSignal,
  parse: (value: unknown, expectedStudentId: string) => T | null,
  label: string,
): Promise<ProjectionResult<T>> {
  try {
    const response = await fetch(path, { cache: "no-store", signal });
    if (response.status === 401) return { kind: "auth" };
    if (!response.ok) return { kind: "error", message: await apiMessage(response, `${label} tạm thời chưa sẵn sàng.`) };
    const envelope = await response.json() as ApiEnvelope<unknown>;
    const parsed = parse(envelope.data, studentId);
    if (!parsed) return { kind: "error", message: `${label} trả về dữ liệu không hợp lệ.` };
    return { kind: "ok", data: parsed };
  } catch {
    if (signal.aborted) return { kind: "aborted" };
    return { kind: "error", message: `${label} tạm thời chưa sẵn sàng.` };
  }
}

async function apiMessage(response: Response, fallback: string) {
  try {
    const envelope = await response.json() as ApiEnvelope<unknown>;
    return envelope.error?.message || fallback;
  } catch { return fallback; }
}

const dateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  weekday: "long",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Ho_Chi_Minh",
});
const timeFormatter = new Intl.DateTimeFormat("vi-VN", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Ho_Chi_Minh",
});

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? dateTimeFormatter.format(date) : "Thời gian từ Core";
}

function formatTime(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? timeFormatter.format(date) : "—";
}

function initials(displayName: string) {
  return displayName.trim().split(/\s+/).slice(-2).map((part) => part[0]?.toUpperCase() ?? "").join("");
}
