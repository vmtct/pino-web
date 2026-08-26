import type { ReactNode } from "react";
import OpenStudioPublicChrome from "./public-chrome";
import "./polish.css";
import "./polish-round2.css";
import "./polish-desktop.css";
import "./shell-normalize.css";

export default function OpenStudioLayout({ children }: { children: ReactNode }) {
  return <OpenStudioPublicChrome>{children}</OpenStudioPublicChrome>;
}
