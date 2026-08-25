"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import styles from "./piner.module.css";

type ParentSession = {
  principalType: "PARENT_USER";
  parent: { id: string; displayName: string };
  session: { id: string; issuedAt: string; expiresAt: string };
};

type StudentSummary = { id: string; displayName: string };
type ViewState = "loading" | "signed-out" | "change-pin" | "ready" | "unavailable";

type ApiEnvelope<T> = { data?: T; error?: { code?: string; message?: string } };

export default function PinerMemberEntry() {
  const [view, setView] = useState<ViewState>("loading");
  const [session, setSession] = useState<ParentSession | null>(null);
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [activeStudentId, setActiveStudentId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void restoreSession();
  }, []);

  const activeStudent = useMemo(
    () => students.find((student) => student.id === activeStudentId) ?? students[0] ?? null,
    [students, activeStudentId],
  );

  async function restoreSession() {
    setView("loading");
    setError("");
    try {
      const response = await fetch("/api/piner/session", { cache: "no-store" });
      if (response.status === 401) {
        setView("signed-out");
        return;
      }
      if (!response.ok) {
        setView("unavailable");
        setError(await apiMessage(response, "Piner tạm thời chưa sẵn sàng."));
        return;
      }
      const envelope = await response.json() as ApiEnvelope<ParentSession>;
      if (!envelope.data) throw new Error("Missing member session payload");
      setSession(envelope.data);
      await loadStudents();
    } catch {
      setView("unavailable");
      setError("Piner tạm thời chưa sẵn sàng. Vui lòng thử lại sau.");
    }
  }

  async function loadStudents() {
    const response = await fetch("/api/piner/students", { cache: "no-store" });
    if (response.status === 401) {
      setSession(null);
      setStudents([]);
      setView("signed-out");
      return;
    }
    if (!response.ok) throw new Error(await apiMessage(response, "Không thể tải Piner của gia đình."));
    const envelope = await response.json() as ApiEnvelope<StudentSummary[]>;
    const canonicalStudents = Array.isArray(envelope.data) ? envelope.data : [];
    setStudents(canonicalStudents);
    setActiveStudentId(canonicalStudents[0]?.id ?? "");
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
    setSession(null);
    setStudents([]);
    setActiveStudentId("");
    setView("signed-out");
  }

  if (view === "loading") return <Loading />;
  if (view === "signed-out") return <AuthCard onSubmit={login} error={error} />;
  if (view === "change-pin") return <ChangePinCard onSubmit={changePin} error={error} />;
  if (view === "unavailable") return <Unavailable message={error} onRetry={() => void restoreSession()} />;

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <a className={styles.brand} href="/" aria-label="PINO House">PINO<span>•</span></a>
        <button className={styles.textButton} type="button" onClick={() => void logout()}>Đăng xuất</button>
      </header>

      <section className={styles.workspace}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>PINER SPACE</p>
          <h1>Xin chào, {session?.parent.displayName || "gia đình PINO"}.</h1>
          <p>Chọn một Piner để xem không gian của con. Mỗi màn hình chỉ dùng dữ liệu được Core xác nhận cho đúng Parent → Student relationship.</p>
        </div>

        <section className={styles.studentStrip} aria-label="Chọn Piner">
          {students.length === 0 ? (
            <div className={styles.emptyState}>
              <strong>Chưa có Piner được liên kết.</strong>
              <span>Không có dữ liệu learner nào được suy diễn hoặc lấy từ nguồn legacy để lấp chỗ trống.</span>
            </div>
          ) : students.map((student) => {
            const selected = student.id === activeStudent?.id;
            return (
              <button
                type="button"
                key={student.id}
                className={`${styles.studentCard} ${selected ? styles.studentCardActive : ""}`}
                aria-pressed={selected}
                onClick={() => setActiveStudentId(student.id)}
              >
                <span className={styles.avatar}>{initials(student.displayName)}</span>
                <span><strong>{student.displayName}</strong><small>{selected ? "Piner đang xem" : "Chọn Piner"}</small></span>
              </button>
            );
          })}
        </section>

        {activeStudent ? (
          <section className={styles.homeGrid}>
            <article className={styles.heroCard}>
              <div>
                <p className={styles.eyebrow}>TRANG CHỦ</p>
                <h2>{activeStudent.displayName}</h2>
                <p>Identity và quyền truy cập đã là canonical. Journey, lịch và next action chỉ xuất hiện khi read model tương ứng từ Core được kết nối.</p>
              </div>
              <span className={styles.canonicalBadge}>Canonical learner</span>
            </article>

            <article className={styles.surfaceCard}>
              <p className={styles.eyebrow}>HÀNH TRÌNH</p>
              <h3>Đang kết nối Journey</h3>
              <p>Piner không tự tính level hoặc tiến độ từ Attendance, fixture hay state trong trình duyệt.</p>
              <span className={styles.pending}>Canonical read model pending</span>
            </article>

            <article className={styles.surfaceCard}>
              <p className={styles.eyebrow}>THÀNH QUẢ</p>
              <h3>Chưa có dữ liệu để hiển thị</h3>
              <p>V0 giữ empty state an toàn thay vì tạo Collection từ raw Evidence hay dữ liệu prototype.</p>
              <span className={styles.pending}>Canonical-empty</span>
            </article>

            <a className={`${styles.surfaceCard} ${styles.exploreCard}`} href="/open-studio">
              <p className={styles.eyebrow}>KHÁM PHÁ</p>
              <h3>Open Studio</h3>
              <p>Xem các hoạt động hiện có. Booking/eligibility vẫn do Core quyết định khi member action được nối vào vertical slice.</p>
              <span className={styles.linkHint}>Khám phá →</span>
            </a>
          </section>
        ) : null}
      </section>
    </main>
  );
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

function AuthFrame({ eyebrow, title, note, children }: { eyebrow: string; title: string; note: string; children: React.ReactNode }) {
  return <main className={styles.authPage}><section className={styles.authCard}><a className={styles.brand} href="/">PINO<span>•</span></a><div><p className={styles.eyebrow}>{eyebrow}</p><h1>{title}</h1><p>{note}</p></div>{children}<small className={styles.securityNote}>Phiên đăng nhập được giữ trong cookie bảo mật; PIN và session token không được lưu trong localStorage.</small></section></main>;
}

function Loading() {
  return <main className={styles.authPage}><section className={styles.loadingCard}><span className={styles.loader} /><strong>Đang mở Piner…</strong></section></main>;
}

function Unavailable({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <main className={styles.authPage}><section className={styles.authCard}><a className={styles.brand} href="/">PINO<span>•</span></a><div><p className={styles.eyebrow}>PINER SPACE</p><h1>Tạm thời chưa sẵn sàng.</h1><p>{message}</p></div><button className={styles.primaryButton} onClick={onRetry}>Thử lại</button></section></main>;
}

async function apiMessage(response: Response, fallback: string) {
  try {
    const envelope = await response.json() as ApiEnvelope<unknown>;
    return envelope.error?.message || fallback;
  } catch { return fallback; }
}

function initials(displayName: string) {
  return displayName.trim().split(/\s+/).slice(-2).map((part) => part[0]?.toUpperCase() ?? "").join("");
}
