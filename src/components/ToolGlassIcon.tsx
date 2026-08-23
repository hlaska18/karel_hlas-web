"use client";

import Image from "next/image";
import { TOOL_ICON } from "@/lib/bankLabels";

/**
 * Skleněná ikona tématu s průhledným pozadím – „plave" přímo na dlaždici,
 * žádný rám. Jedna verze funguje na světlém i tmavém režimu. Když téma ikonu
 * nemá, nevykreslí nic (volající řeší lucide fallback).
 */
export function ToolGlassIcon({
  tool,
  className = "h-full w-full object-contain",
  hoverClassName = "group-hover:scale-105",
  sizes = "(min-width: 1024px) 152px, 96px",
}: {
  tool: string;
  className?: string;
  /**
   * Jak ikona reaguje na najetí. Výchozí `group-hover:` míří na dlaždici
   * v bance. Ukázky materiálů v úvodu mají skupin víc (stoh karet a karta
   * v něm), takže si posílají vlastní `group-hover/karta:` – dvě různá
   * `scale-*` naráz by se přebíjela podle pořadí v CSS, ne podle záměru.
   */
  hoverClassName?: string;
  /** Bez `sizes` sáhne Next na retině po w=640, i když se kreslí 36 px. */
  sizes?: string;
}) {
  const src = TOOL_ICON[tool];
  if (!src) return null;
  return (
    <Image
      src={src}
      alt=""
      width={320}
      height={320}
      sizes={sizes}
      className={`${className} transition duration-300 ${hoverClassName}`}
    />
  );
}

/** Má téma vlastní skleněnou ikonu? (jinak volající ukáže lucide fallback) */
export function hasToolGlassIcon(tool: string): boolean {
  return Boolean(TOOL_ICON[tool]);
}
