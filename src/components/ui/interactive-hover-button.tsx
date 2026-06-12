"use client";

import { ArrowRight } from "lucide-react";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

/**
 * InteractiveHoverButton – v klidu sklo se smaragdovou tečkou vlevo; po najetí
 * se tečka rozlije přes celé tlačítko a text se vymění za bílý s ikonou.
 *  - s href se vykreslí jako <a> (kotvy chytá SmoothScroll), jinak <button>
 *  - touch zařízení bez hoveru vidí klidový stav = plně čitelné a klikatelné
 */

type CommonProps = {
  text: string;
  /** Ikona v hover stavu (výchozí šipka doprava). */
  icon?: ReactNode;
  className?: string;
};

type AnchorProps = CommonProps & { href: string } & Omit<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    "href" | "className" | "children"
  >;
type NativeButtonProps = CommonProps & { href?: undefined } & Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "className" | "children"
  >;

const baseCls =
  "group relative inline-flex min-h-[44px] cursor-pointer select-none items-center justify-center " +
  "overflow-hidden rounded-full border border-black/10 bg-white/60 py-3 pl-10 pr-6 " +
  "text-sm font-semibold text-zinc-800 backdrop-blur-md " +
  "transition-all duration-300 hover:-translate-y-0.5 hover:border-accent-500/40 hover:shadow-lg hover:shadow-accent-600/30 " +
  "dark:border-white/15 dark:bg-white/10 dark:text-zinc-100";

function Inner({ text, icon }: { text: string; icon?: ReactNode }) {
  return (
    <>
      {/* klidový text */}
      <span className="inline-block transition-all duration-300 group-hover:translate-x-10 group-hover:opacity-0">
        {text}
      </span>

      {/* hover vrstva: text + ikona na smaragdu */}
      <span
        aria-hidden
        className="absolute inset-0 z-10 flex translate-x-10 items-center justify-center gap-2 text-white opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
      >
        {text}
        {icon ?? <ArrowRight className="h-4 w-4" />}
      </span>

      {/* tečka → po najetí se rozlije přes celé tlačítko */}
      <span
        aria-hidden
        className="absolute left-4 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-accent-500 transition-all duration-300 group-hover:left-0 group-hover:top-0 group-hover:h-full group-hover:w-full group-hover:translate-y-0 group-hover:scale-[1.8] group-hover:bg-accent-600"
      />
    </>
  );
}

export function InteractiveHoverButton(props: AnchorProps | NativeButtonProps) {
  const { text, icon, className = "" } = props;
  const cls = `${baseCls} ${className}`.trim();

  if (props.href !== undefined) {
    const { text: _t, icon: _i, className: _c, ...rest } = props as AnchorProps;
    return (
      <a {...rest} className={cls}>
        <Inner text={text} icon={icon} />
      </a>
    );
  }

  const { text: _t, icon: _i, className: _c, ...rest } = props as NativeButtonProps;
  return (
    <button type="button" {...rest} className={cls}>
      <Inner text={text} icon={icon} />
    </button>
  );
}

export default InteractiveHoverButton;
