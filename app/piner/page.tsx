import { prototypePinerSpaceSource } from "../../lib/piner-space-source";
import PinerSpace from "./piner-space";

export const metadata = {
  title: "Piner Space · PINO",
  description: "PINO learner and Parent member space prototype shell.",
};

export default async function Page() {
  const result = await prototypePinerSpaceSource.load();
  return <PinerSpace result={result} />;
}
