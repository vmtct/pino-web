import { Be_Vietnam_Pro, Lora } from "next/font/google";
import PinerMemberEntry from "./piner-member-entry";

const pinerSans = Be_Vietnam_Pro({ subsets: ["latin", "vietnamese"], weight: ["400", "500", "600", "700"], variable: "--font-piner-sans", display: "swap" });
const pinerSerif = Lora({ subsets: ["latin", "vietnamese"], weight: ["400", "500", "600", "700"], variable: "--font-piner-serif", display: "swap" });

export const metadata = {
  title: "Piner Space · PINO House",
  description: "Không gian của gia đình PINO.",
};

export default function PinerPage() {
  return <div className={`${pinerSans.variable} ${pinerSerif.variable}`}><PinerMemberEntry /></div>;
}
