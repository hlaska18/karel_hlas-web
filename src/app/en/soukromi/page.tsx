import type { Metadata } from "next";

import { Soukromi } from "@/components/Soukromi";

export const metadata: Metadata = {
  title: "What this site stores",
  description:
    "What the site stores about a visitor, who runs it and where it technically runs.",
};

export default function SoukromiPageEn() {
  return <Soukromi lang="en" />;
}
