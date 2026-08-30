import { Site } from "@/components/Site";
import { getBankItems } from "@/lib/materials";
import { getVystupy } from "@/lib/aihub";

export default function Home() {
  return <Site lang="cs" items={getBankItems()} vystupy={getVystupy()} />;
}
