"use client";

import Image from "next/image";
import { TOOL_ICON, TOOL_ICON_LIGHT } from "@/lib/bankLabels";

/**
 * 3D skleněná ikona tématu s variantou pro světlý/tmavý režim.
 * Přepínání řeší čistě CSS (`dark:`), takže funguje okamžitě při změně
 * motivu bez JS. Když téma ikonu nemá, nevykreslí nic (volající řeší fallback).
 * `className` řídí velikost/rám (výchozí = malá čipová ikona).
 */
export function ToolGlassIcon({
  tool,
  className = "h-14 w-14 rounded-xl object-cover ring-1",
}: {
  tool: string;
  className?: string;
}) {
  const dark = TOOL_ICON[tool];
  const light = TOOL_ICON_LIGHT[tool];
  if (!dark) return null;

  const base = `${className} transition duration-300 group-hover:scale-105 group-hover:ring-accent-500/40`;
  return (
    <>
      <Image
        src={light ?? dark}
        alt=""
        width={320}
        height={320}
        className={`${base} ring-black/10 dark:hidden`}
      />
      <Image
        src={dark}
        alt=""
        width={320}
        height={320}
        className={`${base} hidden ring-white/10 dark:block`}
      />
    </>
  );
}

/** Má téma vlastní skleněnou ikonu? (jinak volající ukáže lucide fallback) */
export function hasToolGlassIcon(tool: string): boolean {
  return Boolean(TOOL_ICON[tool]);
}
