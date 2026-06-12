"use client";

import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

/**
 * LiquidButton – „liquid glass" tlačítko (frosted sklo + SVG distorze).
 *  - variant "glass":   průhledné sklo, text tmavý/světlý dle režimu
 *  - variant "primary": smaragdově tónované sklo s bílým textem (hlavní CTA)
 *  - s href se vykreslí jako <a> (kotvy chytá SmoothScroll), jinak <button>
 *  - distorze přes backdrop-filter url(#…) je progresivní vylepšení (Chromium);
 *    Safari/Firefox mají fallback na čisté backdrop-blur sklo
 */

type Variant = "glass" | "primary";

const FILTER_ID = "liquid-btn-distortion";

const base =
  "group relative inline-flex cursor-pointer select-none items-center justify-center gap-2 " +
  "overflow-hidden rounded-full px-5 py-3 text-sm font-semibold " +
  "transition duration-200 hover:-translate-y-0.5 active:translate-y-0";

const variants: Record<Variant, { root: string; body: string }> = {
  glass: {
    root: "text-zinc-800 hover:text-accent-700 dark:text-zinc-100 dark:hover:text-accent-300",
    body:
      "border border-white/50 bg-white/60 shadow-[0_4px_16px_-6px_rgba(2,44,34,0.25),inset_1px_1px_1px_rgba(255,255,255,0.85),inset_-1px_-1px_1px_rgba(255,255,255,0.35)] " +
      "dark:border-white/15 dark:bg-white/10 dark:shadow-[0_10px_24px_-12px_rgba(0,0,0,0.7),inset_1px_1px_1px_rgba(255,255,255,0.18)]",
  },
  primary: {
    root: "text-white",
    body:
      "border border-white/30 bg-gradient-to-b from-accent-500/95 to-accent-600/95 " +
      "shadow-[0_10px_24px_-10px_rgba(5,150,105,0.65),inset_1px_1px_1px_rgba(255,255,255,0.5),inset_-1px_-2px_2px_rgba(2,44,34,0.25)] " +
      "group-hover:from-accent-500 group-hover:to-accent-500 dark:border-white/20",
  },
};

function GlassLayers({ variant }: { variant: Variant }) {
  return (
    <>
      {/* 1) distorze pozadí (jen prohlížeče s podporou url() filtru) */}
      <span
        aria-hidden
        className="absolute inset-0 -z-20 overflow-hidden rounded-full backdrop-blur-md"
        style={{ backdropFilter: `blur(8px) url(#${FILTER_ID})` }}
      />
      {/* 2) tělo skla – tint, border, vnitřní odlesky */}
      <span aria-hidden className={`absolute inset-0 -z-10 rounded-full transition-colors duration-200 ${variants[variant].body}`} />
      {/* 3) horní odlesk */}
      <span
        aria-hidden
        className="absolute inset-x-3 top-[2px] -z-10 h-1/3 rounded-full bg-gradient-to-b from-white/60 to-transparent opacity-70 dark:from-white/25"
      />
    </>
  );
}

/** SVG filtr s jemným „tekutým" zvlněním – stačí jednou na stránce. */
export function LiquidGlassFilter() {
  return (
    <svg aria-hidden className="absolute h-0 w-0 overflow-hidden">
      <defs>
        <filter id={FILTER_ID} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="2" seed="7" result="noise" />
          <feGaussianBlur in="noise" stdDeviation="2" result="soft" />
          <feDisplacementMap in="SourceGraphic" in2="soft" scale="36" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}

type AnchorProps = { href: string; variant?: Variant; className?: string; children: ReactNode } & Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href" | "className" | "children"
>;
type NativeButtonProps = { href?: undefined; variant?: Variant; className?: string; children: ReactNode } & Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "className" | "children"
>;

export function LiquidButton(props: AnchorProps | NativeButtonProps) {
  const { variant = "glass", className = "", children } = props;
  const cls = `${base} ${variants[variant].root} ${className}`.trim();

  if (props.href !== undefined) {
    const { variant: _v, className: _c, children: _ch, ...rest } = props as AnchorProps;
    return (
      <a {...rest} className={cls}>
        <GlassLayers variant={variant} />
        <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
      </a>
    );
  }

  const { variant: _v, className: _c, children: _ch, ...rest } = props as NativeButtonProps;
  return (
    <button type="button" {...rest} className={cls}>
      <GlassLayers variant={variant} />
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </button>
  );
}
