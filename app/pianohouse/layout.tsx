import type { ReactNode } from "react";
import { LegacyLocaleBridge } from "../components/legacy-locale-bridge";
import { PIANOHOUSE_TRANSLATIONS } from "./localized-copy";
import "./short-polish.css";

export default function PianoHouseLayout({ children }: { children: ReactNode }) {
  return <>{children}<LegacyLocaleBridge selector="main" translations={PIANOHOUSE_TRANSLATIONS} /></>;
}
