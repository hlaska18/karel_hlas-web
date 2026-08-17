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
}: {
  tool: string;
  className?: string;
}) {
  const src = TOOL_ICON[tool];
  if (!src) return null;
  return (
    <Image
      src={src}
      alt=""
      width={320}
      height={320}
      // Kreslí se na 78–152 px, ale bez `sizes` sáhne Next na retině po w=640.
      sizes="(min-width: 1024px) 152px, 96px"
      className={`${className} transition duration-300 group-hover:scale-105`}
    />
  );
}

/** Má téma vlastní skleněnou ikonu? (jinak volající ukáže lucide fallback) */
export function hasToolGlassIcon(tool: string): boolean {
  return Boolean(TOOL_ICON[tool]);
}
