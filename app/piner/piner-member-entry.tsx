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
import { parseToppiProjection } from "../../lib/piner-toppi-projection";
import type { ToppiMemberProjection, ToppiProgramProgress } from "../../lib/piner-toppi-projection";
import { parseToppiPracticeCompletion, parseToppiPracticeProjection } from "../../lib/piner-toppi-practice-projection";
import type { ToppiPracticeProjection, ToppiPracticeSet } from "../../lib/piner-toppi-practice-projection";
import styles from "./piner.module.css";

type ViewState = "loading" | "signed-out" | "change-pin" | "ready" | "unavailable";
type Destination = "home" | "journey" | "collection" | "explore";
type ApiEnvelope<T> = { data?: T; error?: { code?: string; message?: string } };
type ProjectionResult<T> =
  | { kind: "ok"; data: T }
  | { kind: "auth" }
  | { kind: "aborted" }
  | { kind: "error"; message: string };
type OptionalProjectionResult<T> = ProjectionResult<T> | { kind: "absent" };
type PracticeSubmissionInput =
  | { kind: "SPEAKING"; audio: Blob }
  | { kind: "WORKSHEET"; textResponse: string };

export default function PinerMemberEntry() {
  const [view, setView] = useState<ViewState>("loading");
  const [session, setSession] = useState<PinerParentSession | null>(null);
  const [students, setStudents] = useState<PinerStudentSummary[]>([]);
  const [activeStudentId, setActiveStudentId] = useState("");
  const [destination, setDestination] = useState<Destination>("home");
  const [error, setError] = useState("");
  const [home, setHome] = useState<MemberHomeProjection | null>(null);
  const [journey, setJourney] = useState<MemberJourneyProjection | null>(null);
  const [toppi, setToppi] = useState<ToppiMemberProjection | null>(null);
  const [toppiError, setToppiError] = useState("");
  const [toppiLoading, setToppiLoading] = useState(false);
  const [toppiOpen, setToppiOpen] = useState(false);
  const [toppiPractice, setToppiPractice] = useState<ToppiPracticeProjection | null>(null);
  const [toppiPracticeError, setToppiPracticeError] = useState("");
  const [toppiPracticeLoading, setToppiPracticeLoading] = useState(false);
  const [toppiPracticeBusy, setToppiPracticeBusy] = useState(false);
  const [toppiPracticeNotice, setToppiPracticeNotice] = useState("");
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
  const visibleToppi = toppi?.student.id === activeStudentId ? toppi : null;
  const visibleToppiPractice = toppiPractice?.student.id === activeStudentId ? toppiPractice : null;

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
    setToppi(null);
    setToppiError("");
    setToppiLoading(true);
    setToppiOpen(false);
    setToppiPractice(null);
    setToppiPracticeError("");
    setToppiPracticeLoading(true);
    setToppiPracticeNotice("");
    setHomeError("");
    setJourneyError("");

    void readToppiProjection(requestedStudentId, controller.signal).then((result) => {
      if (controller.signal.aborted || version !== projectionVersion.current) return;
      if (result.kind === "auth") { clearMemberContext(); setView("signed-out"); return; }
      applyToppiResult(result, requestedStudentId, version);
      setToppiLoading(false);
    });
    void readToppiPracticeProjection(requestedStudentId, controller.signal).then((result) => {
      if (controller.signal.aborted || version !== projectionVersion.current) return;
      if (result.kind === "auth") { clearMemberContext(); setView("signed-out"); return; }
      if (result.kind === "error") { setToppiPracticeError(result.message); setToppiPractice(null); }
      if (result.kind === "ok" && projectionResponseIsCurrent(requestedStudentId, result.data.student.id, activeStudentRef.current, version, projectionVersion.current)) {
        setToppiPractice(result.data);
        setToppiPracticeError("");
      }
      setToppiPracticeLoading(false);
    });

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

  function applyToppiResult(result: OptionalProjectionResult<ToppiMemberProjection>, studentId: string, version: number) {
    if (result.kind === "aborted" || result.kind === "auth") return;
    if (result.kind === "absent") { setToppi(null); setToppiError(""); return; }
    if (result.kind === "error") { setToppi(null); setToppiError(result.message); return; }
    if (!projectionResponseIsCurrent(studentId, result.data.student.id, activeStudentRef.current, version, projectionVersion.current)) return;
    setToppi(result.data);
    setToppiError("");
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
  async function completeToppiPractice(practiceSetId: string, optionId: string, submission: PracticeSubmissionInput) {
    const studentId = activeStudentRef.current;
    if (!studentId || toppiPracticeBusy) return;
    setToppiPracticeBusy(true);
    setToppiPracticeError("");
    setToppiPracticeNotice("");
    try {
      const headers = new Headers({ "Idempotency-Key": crypto.randomUUID() });
      let body: BodyInit;
      if (submission.kind === "SPEAKING") {
        const form = new FormData();
        form.set("practiceSetId", practiceSetId);
        form.set("optionId", optionId);
        form.set("kind", "SPEAKING");
        const extension = submission.audio.type.includes("mp4") ? "m4a" : submission.audio.type.includes("ogg") ? "ogg" : "webm";
        form.set("audio", submission.audio, `toppi-practice.${extension}`);
        body = form;
      } else {
        headers.set("Content-Type", "application/json");
        body = JSON.stringify({ practiceSetId, optionId, kind: "WORKSHEET", textResponse: submission.textResponse });
      }
      const response = await fetch(`/api/piner/students/${studentId}/toppi/practice/completions`, {
        method: "POST",
        headers,
        body,
      });
      if (response.status === 401) { clearMemberContext(); setView("signed-out"); return; }
      if (!response.ok) { setToppiPracticeError(await apiMessage(response, "Chưa thể hoàn thành bài luyện tập.")); return; }
      const parsed = parseToppiPracticeCompletion(await response.json());
      if (!parsed) { setToppiPracticeError("Toppi đã phản hồi nhưng completion chưa hợp lệ."); return; }
      if (activeStudentRef.current !== studentId) return;
      setToppiPractice((current) => updatePracticeCompletion(current, parsed));
      setToppiPracticeNotice(`Hoàn thành · +${parsed.reward.amount} ${parsed.reward.code}`);
      const refresh = new AbortController();
      void readToppiPracticeProjection(studentId, refresh.signal).then((result) => {
        if (activeStudentRef.current !== studentId) return;
        if (result.kind === "auth") { clearMemberContext(); setView("signed-out"); return; }
        if (result.kind === "ok") { setToppiPractice(result.data); setToppiPracticeError(""); }
      });
    } catch {
      setToppiPracticeError("Chưa thể hoàn thành bài luyện tập. Vui lòng thử lại.");
    } finally {
      setToppiPracticeBusy(false);
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
    setToppi(null);
    setToppiError("");
    setToppiLoading(false);
    setToppiOpen(false);
    setToppiPractice(null);
    setToppiPracticeError("");
    setToppiPracticeLoading(false);
    setToppiPracticeBusy(false);
    setToppiPracticeNotice("");
    setHomeError("");
    setJourneyError("");
    setProjectionLoading(false);
    setActionBusy(false);
    setActionError("");
    actionReplayRef.current = null;
  }

  function selectStudent(studentId: string) {
    if (studentId === activeStudentId) return;
    projectionAbort.current?.abort();
    projectionVersion.current += 1;
    actionReplayRef.current = null;
    setActionError("");
    setHome(null);
    setJourney(null);
    setToppi(null);
    setToppiError("");
    setToppiLoading(true);
    setToppiOpen(false);
    setToppiPractice(null);
    setToppiPracticeError("");
    setToppiPracticeLoading(true);
    setToppiPracticeBusy(false);
    setToppiPracticeNotice("");
    setHomeError("");
    setJourneyError("");
    setProjectionLoading(true);
    setDestination("home");
    setActiveStudentId(studentId);
  }

  if (view === "loading") return <Loading />;
  if (view === "signed-out") return <AuthCard onSubmit={login} error={error} />;
  if (view === "change-pin") return <ChangePinCard onSubmit={changePin} error={error} />;
  if (view === "unavailable") return <Unavailable message={error} onRetry={() => void restoreSession()} />;

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <a className={styles.brand} href="/" aria-label="PINO House">PINO<span>•</span></a>
        <div className={styles.accountActions}>
          <span>{session?.parent.displayName || "Gia đình PINO"}</span>
          <button className={styles.textButton} type="button" onClick={() => void logout()}>Đăng xuất</button>
        </div>
      </header>

      <section className={styles.workspace}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>PINER SPACE</p>
          <h1>Không gian của {activeStudent?.displayName || "con"}.</h1>
          <p>Trang chủ và Hành trình được đọc trực tiếp từ Core cho đúng Piner đang chọn. Chuyển Piner sẽ thay toàn bộ learner context cùng lúc.</p>
        </div>

        <section className={styles.studentStrip} aria-label="Chọn Piner">
          {students.length === 0 ? (
            <div className={styles.emptyState}>
              <strong>Chưa có Piner được liên kết.</strong>
              <span>Piner không suy diễn learner từ fixture, Notion hay nguồn legacy để lấp chỗ trống.</span>
            </div>
          ) : students.map((student) => {
            const selected = student.id === activeStudent?.id;
            return (
              <button
                type="button"
                key={student.id}
                className={`${styles.studentCard} ${selected ? styles.studentCardActive : ""}`}
                aria-pressed={selected}
                onClick={() => selectStudent(student.id)}
              >                <span className={styles.avatar}>{initials(student.displayName)}</span>
                <span><strong>{student.displayName}</strong><small>{selected ? "Piner đang xem" : "Chọn Piner"}</small></span>
              </button>
            );
          })}
        </section>

        {activeStudent ? (
          <>
            <nav className={styles.destinationNav} aria-label="Không gian Piner">
              <DestinationButton active={destination === "home"} onClick={() => setDestination("home")}>Trang chủ</DestinationButton>
              <DestinationButton active={destination === "journey"} onClick={() => setDestination("journey")}>Hành trình</DestinationButton>
              <DestinationButton active={destination === "collection"} onClick={() => setDestination("collection")}>Thành quả</DestinationButton>
              <DestinationButton active={destination === "explore"} onClick={() => setDestination("explore")}>Khám phá</DestinationButton>
            </nav>

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
                <JourneySurface student={activeStudent} journey={visibleJourney} loading={projectionLoading} error={journeyError} toppi={visibleToppi} toppiLoading={toppiLoading} toppiError={toppiError} toppiOpen={toppiOpen} onOpenToppi={() => setToppiOpen(true)} onCloseToppi={() => setToppiOpen(false)} practice={visibleToppiPractice} practiceLoading={toppiPracticeLoading} practiceError={toppiPracticeError} practiceBusy={toppiPracticeBusy} practiceNotice={toppiPracticeNotice} onCompletePractice={completeToppiPractice} />
              ) : null}
              {destination === "collection" ? <CollectionSurface student={activeStudent} /> : null}
              {destination === "explore" ? <ExploreSurface student={activeStudent} /> : null}
            </section>
          </>
        ) : null}
      </section>
    </main>
  );
}

function DestinationButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className={`${styles.destinationButton} ${active ? styles.destinationButtonActive : ""}`} onClick={onClick} aria-pressed={active}>
      {children}
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
  if (loading && !home) return <SurfaceLoading label="Đang đọc Trang chủ từ Core…" />;
  if (!home) return <SurfaceError title="Trang chủ chưa thể tải." message={error || "Core chưa trả về Trang chủ hợp lệ cho Piner này."} />;

  return (
    <div className={styles.surfaceStack}>
      <section className={styles.heroCard}>
        <div>
          <p className={styles.eyebrow}>TRANG CHỦ · {home.state}</p>
          <h2>{student.displayName}</h2>
          <p>{home.state === "DEGRADED" ? "Một nguồn ưu tiên đang tạm unavailable, nên Piner giữ trạng thái an toàn thay vì tự hạ priority." : "Core đã chọn đúng một next action từ learner context hiện tại."}</p>
        </div>
        <span className={home.state === "DEGRADED" ? styles.degradedBadge : styles.canonicalBadge}>{home.resolverVersion}</span>
      </section>
      {home.state === "DEGRADED" ? (
        <div className={styles.degradedNotice}>
          <strong>Trang chủ đang degraded.</strong>
          <span>Không có CTA thấp-priority nào được frontend tự dựng thay thế.</span>
        </div>
      ) : null}

      <div className={styles.homeGrid}>
        <PrimaryActionCard action={home.primaryAction} home={home} onDestination={onDestination} onOpenStudioAdmission={onOpenStudioAdmission} actionBusy={actionBusy} actionError={actionError} />
        <article className={styles.surfaceCard}>
          <p className={styles.eyebrow}>ĐIỂM HẸN TIẾP THEO</p>
          {home.nextTouchpoint ? (
            <>
              <h3>{formatDateTime(home.nextTouchpoint.scheduledStartsAt)}</h3>
              <p>{home.nextTouchpoint.commitment} · kết thúc {formatTime(home.nextTouchpoint.scheduledEndsAt)}</p>
              <span className={styles.pending}>Session từ Core</span>
            </>
          ) : (
            <><h3>Chưa có điểm hẹn.</h3><p>Không có Session nào được frontend suy diễn từ lịch hoặc fixture.</p></>
          )}
        </article>

        <article className={styles.surfaceCard}>
          <p className={styles.eyebrow}>HÀNH TRÌNH ĐANG MỞ</p>
          {home.journey ? (
            <>
              <h3>{home.journey.focusLabel}</h3>
              <p>{home.journey.pathDisplayName}{home.journey.currentMilestoneLabel ? ` · ${home.journey.currentMilestoneLabel}` : ""}</p>
              <button className={styles.inlineButton} type="button" onClick={() => onDestination("journey")}>Xem Hành trình →</button>
            </>
          ) : (
            <><h3>Chưa có hành trình active.</h3><p>Đây là canonical empty state, không phải permission để tự tính level.</p></>
          )}
        </article>
      </div>
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
      return { title: home.journey?.focusLabel || "Tiếp tục Hành trình", note: home.journey?.currentMilestoneLabel || "Hành trình hiện tại đã sẵn sàng." };
    case "PHYSICAL_TOUCHPOINT":
      return { title: "Buổi học sắp tới", note: home.nextTouchpoint ? formatDateTime(home.nextTouchpoint.scheduledStartsAt) : "Core đã xác định một physical touchpoint." };
    case "EXPLORE_RETURN":
      return { title: "Quay lại Open Studio", note: "Core đã chọn một cơ hội Khám phá phù hợp để quay lại House." };
    case "VIEW_RETAINED_VALUE":
      return { title: "Có nội dung đã giữ lại", note: "Target thuộc member content library; Piner không biến nó thành Collection giả." };
    case "VIEW_FRESH_OUTCOME":
      return { title: "Có thành quả mới", note: "Outcome target được Core sở hữu; F0 không tự tạo outcome từ activity." };
    case "RECOVERY":
      return { title: "Cần cập nhật ngữ cảnh", note: "Core yêu cầu recovery trước khi tiếp tục learner flow." };
  }
}

function JourneySurface({ student, journey, loading, error, toppi, toppiLoading, toppiError, toppiOpen, onOpenToppi, onCloseToppi, practice, practiceLoading, practiceError, practiceBusy, practiceNotice, onCompletePractice }: {
  student: PinerStudentSummary;
  journey: MemberJourneyProjection | null;
  loading: boolean;
  error: string;
  toppi: ToppiMemberProjection | null;
  toppiLoading: boolean;
  toppiError: string;
  toppiOpen: boolean;
  onOpenToppi: () => void;
  onCloseToppi: () => void;
  practice: ToppiPracticeProjection | null;
  practiceLoading: boolean;
  practiceError: string;
  practiceBusy: boolean;
  practiceNotice: string;
  onCompletePractice: (practiceSetId: string, optionId: string, submission: PracticeSubmissionInput) => Promise<void>;
}) {
  if (toppiOpen && toppi && toppi.programs.length > 0) {
    return <ToppiDetailSurface student={student} toppi={toppi} practice={practice} practiceLoading={practiceLoading} practiceError={practiceError} practiceBusy={practiceBusy} practiceNotice={practiceNotice} onCompletePractice={onCompletePractice} onBack={onCloseToppi} />;
  }
  if (loading && !journey) return <SurfaceLoading label="Đang đọc Hành trình từ Core…" />;
  if (!journey) return <SurfaceError title="Hành trình chưa thể tải." message={error || "Core chưa trả về Hành trình hợp lệ cho Piner này."} />;

  const unsupported = journey.paths.filter((path) => path.support === "UNSUPPORTED");
  return (
    <div className={styles.surfaceStack}>
      <section className={styles.sectionHeading}>
        <div><p className={styles.eyebrow}>HÀNH TRÌNH · {journey.state}</p><h2>{student.displayName}</h2></div>
        <span className={styles.canonicalBadge}>Path-native</span>
      </section>
      {journey.state === "NO_ACTIVE_JOURNEY" ? (
        <div className={styles.emptyPanel}><strong>Chưa có Hành trình active.</strong><span>Piner không dựng level từ Attendance hay Evidence.</span></div>
      ) : null}
      {journey.state === "NO_SUPPORTED_PATH" ? (
        <div className={styles.emptyPanel}><strong>Path hiện tại chưa có adapter Hành trình.</strong><span>Trạng thái unsupported được giữ explicit thay vì ép vào grammar PianoHouse.</span></div>
      ) : null}

      {journey.journeys.length > 0 ? (
        <div className={styles.journeyGrid}>
          {journey.journeys.map((item) => (
            <article className={styles.journeyCard} key={item.journeyId}>
              <div className={styles.journeyMeta}><span>{item.path.displayName}</span><span>{item.grammar}</span></div>
              <h3>{item.focus.label}</h3>
              <p className={styles.milestoneLabel}>{item.progress.currentMilestone?.label || "Chưa có milestone hiện tại"}</p>
              <div className={styles.countRow}><strong>{item.progress.achievedMilestoneCount}</strong><span>/ {item.progress.totalMilestoneCount} cột mốc đã được Core ghi nhận</span></div>
              {item.lastRecognizedAt ? <small>Ghi nhận gần nhất: {formatDateTime(item.lastRecognizedAt)}</small> : null}
            </article>
          ))}
        </div>
      ) : null}

      {toppiLoading ? <div className={styles.toppiModuleLoading}><span className={styles.loader} /><span>Đang đọc Toppi…</span></div> : null}
      {!toppiLoading && toppiError ? <div className={styles.toppiModuleNotice}><strong>Toppi tạm thời chưa sẵn sàng.</strong><span>Hành trình PINO vẫn hoạt động bình thường.</span></div> : null}
      {!toppiLoading && toppi && toppi.programs.length > 0 ? <ToppiModuleCard program={toppi.programs[0]} onOpen={onOpenToppi} /> : null}
      {unsupported.length > 0 ? (
        <section className={styles.unsupportedPanel}>
          <p className={styles.eyebrow}>PATH CHƯA HỖ TRỢ</p>
          {unsupported.map((path) => <div key={path.path.id}><strong>{path.path.displayName}</strong><span>{path.unsupportedReason || "Adapter chưa được triển khai"}</span></div>)}
        </section>
      ) : null}
    </div>
  );
}

function ToppiModuleCard({ program, onOpen }: { program: ToppiProgramProgress; onOpen: () => void }) {
  return (
    <article className={styles.toppiModuleCard}>
      <div className={styles.toppiModuleHead}>
        <div><p className={styles.eyebrow}>TOPPI ENGLISH</p><h3>{program.program.name}</h3><p>{program.class_lens.name} · {program.stage.name}</p></div>
        <span className={styles.toppiLevelBadge}>Level {program.level.number}</span>
      </div>
      <div className={styles.toppiModuleStats}>
        <span><strong>{program.evidence_summary.published_count}</strong> minh chứng</span>
        <span><strong>{program.assessment_summary.published_count}</strong> lần đánh giá</span>
      </div>
      <button className={styles.actionButton} type="button" onClick={onOpen}>Mở Toppi →</button>
    </article>
  );
}
function ToppiDetailSurface({ student, toppi, practice, practiceLoading, practiceError, practiceBusy, practiceNotice, onCompletePractice, onBack }: {
  student: PinerStudentSummary;
  toppi: ToppiMemberProjection;
  practice: ToppiPracticeProjection | null;
  practiceLoading: boolean;
  practiceError: string;
  practiceBusy: boolean;
  practiceNotice: string;
  onCompletePractice: (practiceSetId: string, optionId: string, submission: PracticeSubmissionInput) => Promise<void>;
  onBack: () => void;
}) {
  return (
    <div className={styles.surfaceStack}>
      <button className={styles.toppiBackButton} type="button" onClick={onBack}>← Hành trình</button>
      <section className={styles.sectionHeading}>
        <div><p className={styles.eyebrow}>TOPPI · {student.displayName}</p><h2>Toppi English</h2></div>
      </section>
      {toppi.programs.map((program) => (
        <article className={styles.toppiDetailCard} key={program.enrollment_id}>
          <div className={styles.toppiDetailHeader}>
            <div><p className={styles.eyebrow}>{program.class_lens.name}</p><h3>{program.program.name}</h3><p>{program.stage.name}</p></div>
            <span className={styles.toppiLevelBadge}>Level {program.level.number}</span>
          </div>
          <div className={styles.toppiNextStep}>
            <span>Hiện tại</span><strong>{program.level.name}</strong>
            <span>Tiếp theo</span><strong>{program.next_level?.name || "Đã ở Level cuối"}</strong>
          </div>
          <div className={styles.toppiStatGrid}>
            <div><strong>{program.evidence_summary.published_count}</strong><span>Minh chứng</span></div>
            <div><strong>{program.assessment_summary.published_count}</strong><span>Lần đánh giá</span></div>
          </div>
          <section className={styles.toppiCompetencies}>
            <div><p className={styles.eyebrow}>NĂNG LỰC HIỆN TẠI</p></div>
            {program.competencies.length > 0 ? (
              <div className={styles.toppiCompetencyList}>
                {program.competencies.map((item) => (
                  <div className={styles.toppiCompetencyRow} key={item.code}>
                    <span><strong>{item.name}</strong><small>Cập nhật {formatDateTime(item.assessed_at)}</small></span>
                    <b>{competencyStateLabel(item.state)}</b>
                  </div>
                ))}
              </div>
            ) : <div className={styles.toppiEmpty}>Chưa có lần đánh giá được công bố cho Level này.</div>}
          </section>
        </article>
      ))}
      <ToppiPracticePanel practice={practice} loading={practiceLoading} error={practiceError} busy={practiceBusy} notice={practiceNotice} onComplete={onCompletePractice} />
    </div>
  );
}

function ToppiPracticePanel({ practice, loading, error, busy, notice, onComplete }: {
  practice: ToppiPracticeProjection | null;
  loading: boolean;
  error: string;
  busy: boolean;
  notice: string;
  onComplete: (practiceSetId: string, optionId: string, submission: PracticeSubmissionInput) => Promise<void>;
}) {
  const set = practice?.sets[0] ?? null;
  const option = set?.options[0] ?? null;
  const [worksheetText, setWorksheetText] = useState("");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [recording, setRecording] = useState(false);
  const [recordError, setRecordError] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    setWorksheetText("");
    setAudioBlob(null);
    setRecordError("");
    recorderRef.current?.state === "recording" && recorderRef.current.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, [set?.id, option?.id]);
  useEffect(() => {
    if (!audioBlob) { setAudioUrl(""); return; }
    const url = URL.createObjectURL(audioBlob);
    setAudioUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [audioBlob]);

  useEffect(() => () => {
    recorderRef.current?.state === "recording" && recorderRef.current.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  async function startRecording() {
    setRecordError("");
    setAudioBlob(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setRecordError("Thiết bị này chưa hỗ trợ thu âm trong trình duyệt.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
      const mimeType = candidates.find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => { if (event.data.size > 0) chunksRef.current.push(event.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || chunksRef.current[0]?.type || "audio/webm" });
        setAudioBlob(blob.size > 0 ? blob : null);
        if (blob.size < 1) setRecordError("Chưa ghi nhận được âm thanh. Hãy thử thu lại.");
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setRecording(false);
      };
      recorderRef.current = recorder;
      recorder.start(250);
      setRecording(true);
    } catch {
      setRecordError("Piner cần quyền microphone để thu bài nói.");
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }
  if (loading && !practice) return <SurfaceLoading label="Đang đọc bài luyện tập…" />;
  if (!set || !option) return <div className={styles.toppiPracticePanel}><p className={styles.eyebrow}>LUYỆN TẬP</p><strong>Chưa có bài luyện tập cho Level này.</strong>{error ? <span className={styles.error}>{error}</span> : null}</div>;
  const completedOption = set.completion ? set.options.find((item) => item.id === set.completion?.optionId) : null;
  const canComplete = option.kind === "SPEAKING" ? Boolean(audioBlob?.size) : worksheetText.trim().length >= 20;

  async function submit() {
    if (!set || !option || !canComplete) return;
    if (option.kind === "SPEAKING" && audioBlob) {
      await onComplete(set.id, option.id, { kind: "SPEAKING", audio: audioBlob });
    } else if (option.kind === "WORKSHEET") {
      await onComplete(set.id, option.id, { kind: "WORKSHEET", textResponse: worksheetText.trim() });
    }
  }

  return (
    <section className={styles.toppiPracticePanel} aria-label="Luyện tập Toppi">
      <div className={styles.toppiPracticeHeader}>
        <div><p className={styles.eyebrow}>LUYỆN TẬP · {set.level.name}</p><h3>{set.title}</h3><p>{option.kind === "SPEAKING" ? "Bài nói dành cho nhánh Tự tin giao tiếp." : "Worksheet dành cho nhánh Vững nền ngôn ngữ."}</p></div>
        <div className={styles.toppiPracticeReward}><strong>+{set.reward.amount}</strong><span>{set.reward.code}</span></div>
      </div>
      {set.completion ? (
        <div className={styles.toppiPracticeDone} data-testid="toppi-practice-done">
          <span>✓ Đã hoàn thành</span><strong>{completedOption?.title || option.title}</strong>
          <p>+{set.completion.reward?.amount ?? set.reward.amount} {set.reward.code} đã được ghi nhận cho completion này.</p>
          <small>Tổng reward từ Practice đã ghi nhận: {practice?.rewardSummary.earnedTotal ?? 0} PLS</small>
        </div>
      ) : (
        <div className={styles.toppiPracticeWork}>
          <div className={styles.toppiPracticePrompt}><span>{option.kind === "SPEAKING" ? "BÀI NÓI" : "WORKSHEET"}</span><strong>{option.title}</strong><p>{option.prompt}</p><small>{option.instructions}</small></div>
          {option.kind === "SPEAKING" ? (
            <div className={styles.toppiRecorder}>
              <div className={styles.toppiRecorderActions}>
                {!recording ? <button className={styles.inlineButton} type="button" disabled={busy} data-testid="toppi-practice-record-start" onClick={() => void startRecording()}>{audioBlob ? "Thu lại" : "Bắt đầu thu âm"}</button> : null}
                {recording ? <button className={styles.actionButton} type="button" disabled={busy} data-testid="toppi-practice-record-stop" onClick={stopRecording}>Dừng thu âm</button> : null}
                <span>{recording ? "● Đang thu…" : audioBlob ? "Đã có bản thu" : "Chưa thu"}</span>
              </div>
              {audioUrl ? <audio className={styles.toppiAudioPreview} controls src={audioUrl}>Trình duyệt chưa hỗ trợ phát audio.</audio> : null}
              {recordError ? <div className={styles.error}>{recordError}</div> : null}
            </div>
          ) : (
            <textarea className={styles.toppiPracticeTextarea} rows={6} value={worksheetText} onChange={(event) => setWorksheetText(event.target.value)} placeholder="Viết 3–5 câu ở đây…" aria-label="Câu trả lời Worksheet" />
          )}
          <button className={`${styles.actionButton} ${styles.toppiPracticeComplete}`} type="button" disabled={busy || recording || !canComplete} data-testid="toppi-practice-submit" onClick={() => void submit()}>{busy ? "Đang lưu bài…" : `Nộp bài & nhận ${set.reward.amount} PLS`}</button>
        </div>
      )}
      <div className={styles.toppiPracticeWallet} data-state={practice?.rewardSummary.syncState ?? "UNAVAILABLE"} data-testid="toppi-practice-pls-wallet">
        <div><span>PINORIA · PLS</span><strong>{practice?.rewardSummary.pinoriaBalance ?? "—"} PLS</strong></div>
        <small>{practice?.rewardSummary.syncState === "SYNCED" ? "Đã đồng bộ với kho PLS Pinoria." : practice?.rewardSummary.syncState === "PENDING" ? "Bài đã ghi nhận ở Toppi · đang chờ đồng bộ sang Pinoria." : "Bài Toppi vẫn được giữ an toàn · kho Pinoria tạm chưa đọc được."}</small>
      </div>      {notice ? <div className={styles.toppiPracticeNotice}>{notice}</div> : null}
      {error ? <div className={styles.error}>{error}</div> : null}
    </section>
  );
}

function competencyStateLabel(state: string) {
  const labels: Record<string, string> = { emerging: "Đang hình thành", developing: "Đang phát triển", secure: "Vững", advanced: "Nâng cao" };
  return labels[state] || state;
}

function CollectionSurface({ student }: { student: PinerStudentSummary }) {
  return (
    <div className={styles.surfaceStack}>
      <section className={styles.sectionHeading}><div><p className={styles.eyebrow}>THÀNH QUẢ</p><h2>{student.displayName}</h2></div><span className={styles.pending}>Canonical-empty F0</span></section>
      <div className={styles.emptyPanel}>
        <strong>Chưa có Collection contract để hiển thị.</strong>
        <span>Piner không biến raw Evidence, Attendance, milestone hay upload thành “thành quả” giả.</span>
      </div>
    </div>
  );
}

function ExploreSurface({ student }: { student: PinerStudentSummary }) {
  return (
    <div className={styles.surfaceStack}>
      <section className={styles.sectionHeading}><div><p className={styles.eyebrow}>KHÁM PHÁ</p><h2>Một lý do để {student.displayName} quay lại House.</h2></div></section>
      <a className={styles.exploreFeature} href="https://pinohouse.art/open-studio">
        <span>OPEN STUDIO</span><strong>Xem hoạt động đang mở</strong><p>Eligibility, Pass, capacity và admission vẫn do Core quyết định ở owning flow.</p><b>Khám phá →</b>
      </a>
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

async function readToppiProjection(studentId: string, signal: AbortSignal): Promise<OptionalProjectionResult<ToppiMemberProjection>> {
  try {
    const response = await fetch(`/api/piner/students/${studentId}/toppi`, { cache: "no-store", signal });
    if (response.status === 401) return { kind: "auth" };
    if (response.status === 404) return { kind: "absent" };
    if (!response.ok) return { kind: "error", message: await apiMessage(response, "Toppi tạm thời chưa sẵn sàng.") };
    const payload = await response.json() as unknown;
    const parsed = parseToppiProjection(payload, studentId);
    return parsed ? { kind: "ok", data: parsed } : { kind: "error", message: "Toppi trả về dữ liệu chưa hợp lệ." };
  } catch {
    return signal.aborted ? { kind: "aborted" } : { kind: "error", message: "Toppi tạm thời chưa sẵn sàng." };
  }
}

async function readToppiPracticeProjection(studentId: string, signal: AbortSignal): Promise<ProjectionResult<ToppiPracticeProjection>> {
  try {
    const response = await fetch(`/api/piner/students/${studentId}/toppi/practice`, { cache: "no-store", signal });
    if (response.status === 401) return { kind: "auth" };
    if (!response.ok) return { kind: "error", message: await apiMessage(response, "Luyện tập Toppi tạm thời chưa sẵn sàng.") };
    const payload = await response.json() as unknown;
    const parsed = parseToppiPracticeProjection(payload, studentId);
    return parsed ? { kind: "ok", data: parsed } : { kind: "error", message: "Toppi trả về bài luyện tập chưa hợp lệ." };
  } catch {
    return signal.aborted ? { kind: "aborted" } : { kind: "error", message: "Luyện tập Toppi tạm thời chưa sẵn sàng." };
  }
}

function updatePracticeCompletion(
  current: ToppiPracticeProjection | null,
  result: NonNullable<ReturnType<typeof parseToppiPracticeCompletion>>,
): ToppiPracticeProjection | null {
  if (!current) return current;
  let newlyCredited = false;
  const sets: ToppiPracticeSet[] = current.sets.map((set) => {
    if (set.id !== result.completion.practiceSetId || set.completion) return set;
    newlyCredited = !result.replayed;
    return {
      ...set,
      completion: {
        id: result.completion.id,
        optionId: result.completion.optionId,
        completedAt: result.completion.completedAt,
        reward: result.reward,
      },
    };
  });
  return {
    ...current,
    sets,
    rewardSummary: {
      ...current.rewardSummary,
      earnedTotal: current.rewardSummary.earnedTotal + (newlyCredited ? result.reward.amount : 0),
      syncState: newlyCredited ? "PENDING" : current.rewardSummary.syncState,
    },
  };
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
