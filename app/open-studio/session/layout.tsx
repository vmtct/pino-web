import type { ReactNode } from "react";
import HoldRequestFlow from "./hold-request-flow";
import "./polish-v2.css";
import "./polish-v3.css";
import "./polish-v4.css";
import "./hold-request-flow.css";

export default function OpenStudioSessionLayout({ children }: { children: ReactNode }) {
  return <>{children}<HoldRequestFlow /></>;
}
