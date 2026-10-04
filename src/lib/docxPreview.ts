/**
 * Klientský náhled .docx souborů přes knihovnu docx-preview (render přímo
 * v prohlížeči – žádná externí služba nevidí soubor, na rozdíl od MS/Google
 * vieweru, který rada dřív zamítla). Knihovny se načítají lazy až při prvním
 * otevření náhledu Wordu – z vlastní kopie, CDN je záloha (`knihovny.ts`).
 */

import { nactiKnihovnu } from "@/lib/knihovny";


type DocxGlobal = {
  renderAsync: (
    data: Blob | ArrayBuffer,
    bodyContainer: HTMLElement,
    styleContainer?: HTMLElement | null,
    options?: Record<string, unknown>,
  ) => Promise<void>;
};


/**
 * Zmenší vykreslenou stránku tak, aby se vešla do šířky kontejneru.
 *
 * docx-preview kreslí stránku v reálné šířce A4 (~794 px). Na mobilu se tedy
 * nevejde a protože je uvnitř posuvného divu, nejde ani odzoomovat – jde jen
 * vodorovně scrollovat a text je useknutý. Přepočítáme měřítko a stránku
 * zmenšíme; výšku obalu dopočítáme, ať pod dokumentem nezůstane prázdno.
 */
function fitToWidth(container: HTMLElement): void {
  // Pozor: docx-preview vloží do kontejneru nejdřív několik <style> značek,
  // takže obal dokumentu NENÍ prvním potomkem – hledáme ho podle třídy.
  const wrapper = container.querySelector<HTMLElement>(".docx-wrapper");
  const page = wrapper?.querySelector<HTMLElement>("section");
  if (!wrapper || !page) return;

  // Měřítko počítáme z nezmenšené šířky, jinak by se při každém přepočtu
  // zmenšovalo znovu a znovu.
  wrapper.style.transform = "";
  wrapper.style.height = "";
  const pageWidth = page.getBoundingClientRect().width;
  const available = container.clientWidth;
  if (!pageWidth || !available) return;

  const scale = Math.min(1, available / pageWidth);
  if (scale === 1) return;

  wrapper.style.transformOrigin = "top left";
  wrapper.style.transform = `scale(${scale})`;
  wrapper.style.height = `${wrapper.getBoundingClientRect().height}px`;
}

/**
 * Stáhne .docx a vykreslí ho do zadaného kontejneru. Vrací funkci, kterou
 * je potřeba zavolat při zavření náhledu (odpojí sledování změny velikosti).
 */
export async function renderDocx(
  url: string,
  container: HTMLElement,
  signal?: AbortSignal,
): Promise<() => void> {
  await nactiKnihovnu("jszip"); // docx-preview potřebuje globální JSZip
  await nactiKnihovnu("docx");
  const docx = (window as unknown as { docx?: DocxGlobal }).docx;
  if (!docx) throw new Error("docx-preview se nenačetlo");

  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Soubor se nepodařilo stáhnout (${res.status})`);
  const blob = await res.blob();

  container.innerHTML = "";
  await docx.renderAsync(blob, container, null, {
    inWrapper: true,
    breakPages: true,
    ignoreLastRenderedPageBreak: true,
  });

  fitToWidth(container);

  // Otočení mobilu i změna okna mění dostupnou šířku → přepočítat.
  const observer =
    typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => fitToWidth(container));
  observer?.observe(container);
  return () => observer?.disconnect();
}
