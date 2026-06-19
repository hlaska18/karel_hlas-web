import { Site } from "@/components/Site";
import { getBankToolCounts } from "@/lib/materials";

export default function Home() {
  return <Site lang="cs" toolCounts={getBankToolCounts()} />;
}
