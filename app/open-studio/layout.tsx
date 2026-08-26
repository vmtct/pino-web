import type { ReactNode } from "react";
import OpenStudioPublicChrome from "./public-chrome";
import "./presentation.css";

export default function OpenStudioLayout({ children }: { children: ReactNode }) {
  return <OpenStudioPublicChrome>{children}</OpenStudioPublicChrome>;
}
