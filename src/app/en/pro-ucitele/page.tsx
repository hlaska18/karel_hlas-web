import type { Metadata } from "next";
import { getBankItems } from "@/lib/materials";
import { BankPage } from "@/components/BankPage";

export const metadata: Metadata = {
  title: "Material bank for CS teachers",
  description:
    "Free downloadable materials for Computer Science lessons: worksheets, tests, teaching notes and lesson plans. Browse by tool (Excel, Word, Python, Power BI) or search. No login required.",
  alternates: {
    canonical: "/en/pro-ucitele",
    languages: { cs: "/pro-ucitele", en: "/en/pro-ucitele", "x-default": "/pro-ucitele" },
  },
};

export default function ProUciteleEnPage() {
  return <BankPage lang="en" items={getBankItems()} />;
}
