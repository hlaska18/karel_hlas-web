import { Site } from "@/components/Site";
import { getBankItems, polozkyProJazyk } from "@/lib/materials";
import { getVystupy } from "@/lib/aihub";

export default function Home() {
  return <Site lang="cs" items={polozkyProJazyk(getBankItems(), "cs")} vystupy={getVystupy()} />;
}
