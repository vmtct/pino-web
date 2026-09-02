"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { parsePianoPracticeProjection } from "../../lib/piner-piano-practice-projection";
import { parsePianoLibraryPathSummary, parsePianoLibraryProjection } from "../../lib/piner-piano-library-projection";
import type { PianoPracticeProjection } from "../../lib/piner-piano-practice-projection";
import PianoPracticeViewer from "./piano-practice-viewer";
import styles from "./piano-practice-player.module.css";

type LoadState = "idle" | "loading" | "absent" | "locked" | "ready" | "error";
type AccessiblePractice = { resourceId: string; title: string; pathProgramId: string };

export default function PianoPracticePlayer({
  studentId,
  onAuthRequired,
}: {
  studentId: string;
  onAuthRequired: () => void;
}) {
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [projection, setProjection] = useState<PianoPracticeProjection | null>(null);
  const [resourceId, setResourceId] = useState("");
  const [practices, setPractices] = useState<AccessiblePractice[]>([]);
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const authRequiredRef = useRef(onAuthRequired);
  authRequiredRef.current = onAuthRequired;

  useEffect(() => {
    if (!studentId) return;
    const controller = new AbortController();
    setLoadState("loading"); setPractices([]); setResourceId(""); setProjection(null); setMessage("");
    void (async () => {
      const summaryResponse = await fetch(`/api/piner/students/${encodeURIComponent(studentId)}/summary`, { cache: "no-store", signal: controller.signal });
      if (summaryResponse.status === 401) { authRequiredRef.current(); return; }
      if (!summaryResponse.ok) throw new Error(await apiMessage(summaryResponse, "Piano Practice library tạm thời chưa sẵn sàng."));
      const summaryEnvelope = await summaryResponse.json().catch(() => null) as { data?: unknown } | null;
      const paths = parsePianoLibraryPathSummary(summaryEnvelope?.data, studentId);
      if (!paths) throw new Error("Piano Practice nhận được summary chưa hợp lệ.");
      const next: AccessiblePractice[] = [];
      for (const pathProgramId of paths) {
        const response = await fetch(`/api/piner/students/${encodeURIComponent(studentId)}/piano/library?pathProgramId=${encodeURIComponent(pathProgramId)}`, { cache: "no-store", signal: controller.signal });
        if (response.status === 401) { authRequiredRef.current(); return; }
        if (!response.ok) throw new Error(await apiMessage(response, "Piano Practice library tạm thời chưa sẵn sàng."));
        const envelope = await response.json().catch(() => null) as { data?: unknown } | null;
        const library = parsePianoLibraryProjection(envelope?.data, studentId, pathProgramId);
        if (!library) throw new Error("Piano Practice nhận được library chưa hợp lệ.");
        for (const item of library.items) if (item.publishedPracticeResourceId && item.access.capabilities.OPEN_VIEWER === "ALLOWED") next.push({ resourceId: item.publishedPracticeResourceId, title: item.title, pathProgramId });
      }
      const unique = [...new Map(next.map(item => [item.resourceId, item])).values()];
      if (controller.signal.aborted) return;
      setPractices(unique); setResourceId(unique[0]?.resourceId ?? ""); if (!unique.length) setLoadState("absent");
    })().catch(error => { if (controller.signal.aborted || error?.name === "AbortError") return; setLoadState("error"); setMessage(error instanceof Error ? error.message : "Piano Practice library tạm thời chưa sẵn sàng."); });
    return () => controller.abort();
  }, [studentId]);

  useEffect(() => {
    if (!studentId || !resourceId) { setProjection(null); return; }
    const controller = new AbortController();
    setLoadState("loading");
    setProjection(null);
    setMessage("");
    setOpen(false);

    void fetch(`/api/piner/students/${encodeURIComponent(studentId)}/piano/practice-resources/${encodeURIComponent(resourceId)}`, {
      cache: "no-store",
      signal: controller.signal,
    }).then(async (response) => {
      if (controller.signal.aborted) return;
      if (response.status === 401) {
        authRequiredRef.current();
        return;
      }
      if (response.status === 403) {
        setLoadState("locked");
        return;
      }
      if (response.status === 404) {
        setLoadState("absent");
        return;
      }
      if (!response.ok) {
        setLoadState("error");
        setMessage(await apiMessage(response, "Piano Practice tạm thời chưa sẵn sàng."));
        return;
      }
      const envelope = await response.json().catch(() => null) as { data?: unknown } | null;
      const parsed = parsePianoPracticeProjection(envelope?.data, studentId, resourceId);
      if (!parsed) {
        setLoadState("error");
        setMessage("Piano Practice nhận được dữ liệu chưa hợp lệ.");
        return;
      }
      setProjection(parsed);
      setLoadState("ready");
    }).catch((error) => {
      if (controller.signal.aborted || error?.name === "AbortError") return;
      setLoadState("error");
      setMessage("Piano Practice tạm thời chưa sẵn sàng.");
    });

    return () => controller.abort();
  }, [studentId, resourceId]);

  const familyLabel = useMemo(() => {
    if (!projection) return "";
    if (projection.family === "STARTER") return "Khởi Hành";
    if (projection.family === "SPECIALTY") return "Chuyên Đề";
    return "Hành Trình";
  }, [projection]);

  if (loadState === "absent") return null;
  if (loadState === "loading" || loadState === "idle") {
    return <div className={styles.loading}><span className={styles.loader} />Đang mở Piano Practice…</div>;
  }
  if (loadState === "locked") {
    return <section className={styles.notice}><strong>Piano Practice đang khóa.</strong><span>Quyền mở nội dung được Core quyết định.</span></section>;
  }
  if (loadState === "error") {
    return <section className={styles.notice}><strong>Piano Practice chưa thể mở.</strong><span>{message}</span></section>;
  }
  if (!projection) return null;

  if (!open) {
    return (
      <article className={styles.moduleCard} data-testid="piano-practice-module">
        {practices.length > 1 ? <label className={styles.resourcePicker}><span>Bài được mở</span><select value={resourceId} onChange={(event) => setResourceId(event.target.value)}>{practices.map(item => <option key={item.resourceId} value={item.resourceId}>{item.title}</option>)}</select></label> : null}
        <div>
          <p className={styles.eyebrow}>PIANO PRACTICE · {familyLabel.toUpperCase()}</p>
          <h3>{projection.version.title}</h3>
          <p>{projection.pages.length} trang luyện tập</p>
        </div>
        <div className={styles.moduleMeta}>
          <span>v{projection.version.number}</span>
          <span>{projection.pages.length} trang</span>
        </div>
        <button type="button" className={styles.primaryButton} onClick={() => setOpen(true)}>
          Mở bài luyện →
        </button>
      </article>
    );
  }

  return <PianoPracticeViewer projection={projection} accessLabel="Đang mở" onClose={() => setOpen(false)} />;
}

async function apiMessage(response: Response, fallback: string) {
  try {
    const envelope = await response.json() as { error?: { message?: string } };
    return envelope.error?.message || fallback;
  } catch {
    return fallback;
  }
}
