import type { Metadata } from "next";
import "./toppi.css";

export const metadata: Metadata = {
  title: "TOPPI by PINO | English for curious kids",
  description:
    "TOPPI là câu lạc bộ ngôn ngữ và khám phá dành cho trẻ 7–10 tuổi, nơi tiếng Anh được dùng để trò chuyện, kể chuyện, khám phá và tạo ra những điều có ý nghĩa.",
};

export default function ToppiLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
