import type { Metadata } from "next";
import { getBankItems } from "@/lib/materials";
import { BankPage } from "@/components/BankPage";

export const metadata: Metadata = {
  title: "Banka materiálů pro učitele",
  description:
    "Volně stažitelné materiály do hodin informatiky: pracovní listy, testy, metodika a plány hodin. Procházej podle nástroje (Excel, Word, Python, Power BI) nebo hledej. Bez přihlašování.",
  alternates: {
    canonical: "/pro-ucitele",
    languages: { cs: "/pro-ucitele", en: "/en/pro-ucitele", "x-default": "/pro-ucitele" },
  },
};

export default function ProUcitelePage() {
  return <BankPage lang="cs" items={getBankItems()} />;
}
