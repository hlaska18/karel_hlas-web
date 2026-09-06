import type { Metadata } from "next";

import { Soukromi } from "@/components/Soukromi";

export const metadata: Metadata = {
  title: "Co web ukládá",
  description:
    "Co web ukládá o návštěvníkovi, kdo ho provozuje a kde technicky běží. Krátce a bez právničiny.",
};

export default function SoukromiPage() {
  return <Soukromi lang="cs" />;
}
