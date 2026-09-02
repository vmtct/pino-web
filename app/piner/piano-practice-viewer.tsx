"use client";

import { useState } from "react";
import type { PianoPracticeProjection } from "../../lib/piner-piano-practice-projection";
import { pinerPracticeMediaPath } from "../../lib/piner-piano-practice-projection";
import PinerPracticeImmersive from "./PinerPracticeImmersive";
import v6 from "./piano-practice-v6.module.css";
import v7 from "./piano-practice-v7.module.css";
import musicViewer from "./piano-practice-viewer-shell.module.css";
import practiceFocus from "./piano-practice-focus.module.css";
import practiceRatio from "./piano-practice-ratio.module.css";

const ICON_BASE = "https://assets.pinohouse.art/site/shared/piner-space-icon-";
const ROWS = Array.from({ length: 8 }, (_, index) => index);

export default function PianoPracticeViewer({
  projection,
  accessLabel,
  onClose,
}: {
  projection: PianoPracticeProjection;
  accessLabel: string;
  onClose: () => void;
}) {
  const [landscape, setLandscape] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [showWorksheet, setShowWorksheet] = useState(true);
  const page = projection.pages[pageIndex] ?? projection.pages[0];
  if (!page) return null;
  const sheet = pinerPracticeMediaPath(page.sheetMediaPath);
  const worksheet = page.worksheetMediaPath ? pinerPracticeMediaPath(page.worksheetMediaPath) : null;
  const familyLabel = projection.family === "STARTER" ? "Khởi Hành" : projection.family === "SPECIALTY" ? "Chuyên Đề" : "Hành Trình";

  return (
    <div className={`${musicViewer.root} ${practiceFocus.root} ${practiceRatio.root}`}>
      <PinerPracticeImmersive />
      <div className={v6.viewerBackdrop}>
        <section className={v6.viewerShell} data-testid="piano-practice-player">
          <header className={v6.viewerHeader}>
            <div>
              <span className={v6.familyBadge}>{familyLabel.toUpperCase()}</span>
              <strong>{projection.version.title}</strong>
              <small>v{projection.version.number} · {accessLabel}</small>
            </div>
            <button type="button" onClick={onClose} aria-label="Đóng trình luyện tập"><Glyph name="close" /></button>
          </header>

          {!landscape ? (
            <div className={v6.orientationGate}>
              <div className={v6.phoneGlyph}><Glyph name="practice-rotate" size={42} /></div>
              <h2>Lật ngang điện thoại để luyện tập</h2>
              <p>Xoay ngang để xem bản nhạc rõ hơn và tập theo từng câu.</p>
              <button type="button" onClick={() => setLandscape(true)}><Glyph name="practice-rotate" /> <span>Đã xoay ngang</span></button>
            </div>
          ) : (
            <div className={v6.landscapeWorkspace}>
              <div className={v6.stickyTools}>
                <div className={v6.viewTools}>
                  <button
                    type="button"
                    disabled={!worksheet}
                    className={showWorksheet && worksheet ? v6.activeTool : ""}
                    onClick={() => setShowWorksheet((value) => !value)}
                  >
                    <Glyph name="practice-sheet" />
                    <span>{!worksheet ? "Không có hướng dẫn" : showWorksheet ? "Ẩn hướng dẫn" : "Hiện hướng dẫn"}</span>
                  </button>
                </div>
                <div className={v6.accessPreview}><span>Quyền luyện tập</span><b>{accessLabel}</b></div>
              </div>

              <div className={v7.pageTabs} aria-label="Practice pages">
                {projection.pages.map((candidate, index) => (
                  <button
                    type="button"
                    key={candidate.id}
                    className={pageIndex === index ? v7.pageTabActive : ""}
                    onClick={() => setPageIndex(index)}
                  >
                    <strong>Trang {candidate.order}</strong>
                    <small>{candidate.worksheetMediaPath ? "Bản nhạc + hướng dẫn" : "Bản nhạc"}</small>
                  </button>
                ))}
              </div>
              <div className={v6.viewerHint}>
                <strong>Trang {page.order} · tập theo từng câu</strong>
                <span>{worksheet ? "Bản nhạc ở trên · hướng dẫn thế tay ngay bên dưới từng câu." : "Trang này chỉ có bản nhạc."}</span>
              </div>

              <div className={v6.phraseScroller} key={page.id}>
                {ROWS.map((rowIndex) => (
                  <article className={v6.phrasePair} key={rowIndex}>
                    <div className={v6.phraseHeading}>
                      <span>Câu {rowIndex + 1}</span>
                      <small>{showWorksheet && worksheet ? "Sheet + keyboard mapping" : "Sheet only"}</small>
                    </div>
                    {sheet ? <RowCrop src={sheet} rowIndex={rowIndex} alt={`${projection.version.title} trang ${page.order} câu ${rowIndex + 1}`} /> : null}
                    {showWorksheet && worksheet ? (
                      <div className={v6.worksheetRow}>
                        <RowCrop src={worksheet} rowIndex={rowIndex} alt={`${projection.version.title} worksheet trang ${page.order} câu ${rowIndex + 1}`} />
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>

              <footer className={v6.viewerFooter}>
                <span>Luyện tập theo từng câu</span>
                <small>Tiến trình học chỉ thay đổi khi giáo viên ghi nhận.</small>
              </footer>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function RowCrop({ src, rowIndex, alt }: { src: string; rowIndex: number; alt: string }) {
  return (
    <div className={v6.rowCrop}>
      {/* Native img is intentional: the approved viewer crops one protected sheet into eight phrase rows. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} draggable={false} style={{ top: `${-rowIndex * 100}%` }} />
    </div>
  );
}

function Glyph({ name, size = 18 }: { name: string; size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`${ICON_BASE}${name}.svg`} alt="" aria-hidden="true" width={size} height={size} />;
}
