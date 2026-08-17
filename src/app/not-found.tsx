import type { Metadata } from "next";
import { NotFoundContent } from "@/components/NotFoundContent";

/**
 * Titulek záložky říkal jen název webu, takže z ní nebylo poznat, že něco
 * nesedí – v deseti otevřených panelech vypadala chyba jako běžná stránka.
 *
 * Titulek je česky i pro /en/…: `metadata` se vyhodnotí na serveru, kde adresa
 * ještě není známá, kdežto jazyk obsahu si komponenta určí až v prohlížeči.
 * Anglická 404 je natolik okrajová, že se kvůli ní nevyplatí zavádět druhou
 * cestu; text na stránce se přepne správně.
 */
export const metadata: Metadata = {
  title: "Stránka nenalezena",
};

export default function NotFound() {
  return <NotFoundContent />;
}
