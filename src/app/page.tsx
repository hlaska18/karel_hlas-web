import { Site } from "@/components/Site";
import { getFolderMaterials } from "@/lib/materials";

export default function Home() {
  return <Site lang="cs" folderMaterials={getFolderMaterials()} />;
}
