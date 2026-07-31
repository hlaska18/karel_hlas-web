"use client";

import { useEffect, useState } from "react";
import { Menu, X, User, Mail, Library } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LangToggle } from "@/components/LangToggle";
import { Monogram } from "@/components/Monogram";
import InteractiveHoverButton from "@/components/ui/interactive-hover-button";

export function Header() {
  const { tr } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // One-page: všechno jsou kotvy na téže stránce (pořadí sekcí 01–03).
  const links = [
    { href: "#banka", label: tr.nav.bank },
    { href: "#about", label: tr.nav.about },
    { href: "#contact", label: tr.nav.contact },
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "glass-bar" : "border-b border-transparent"
      }`}
    >
      <nav className="container-page flex h-16 items-center justify-between gap-4">
        {/* Logo / monogram */}
        <a href="#top" className="group flex items-center gap-2.5" aria-label={tr.nav.brand}>
          <Monogram className="shadow-sm transition group-hover:bg-accent-500" />
          {/* Web je banka materiálů, ne osobní portfolio – logo proto pojmenuje
              téma a jméno je až podtitulek (stejná logika jako v úvodní sekci). */}
          <span className="hidden leading-tight sm:block">
            <span className="block font-display text-sm font-semibold tracking-tight">
              {tr.nav.brand}
            </span>
            <span className="block text-[0.7rem] text-zinc-500 dark:text-zinc-400">
              {tr.nav.brandSub}
            </span>
          </span>
        </a>

        {/* Desktop nav – stejná pilulková tlačítka jako v úvodu (InteractiveHoverButton) */}
        <div className="hidden items-center gap-2.5 lg:flex">
          <InteractiveHoverButton
            href="#banka"
            text={tr.nav.bank}
            size="sm"
            icon={<Library className="h-4 w-4" />}
          />
          <InteractiveHoverButton
            href="#about"
            text={tr.nav.about}
            size="sm"
            icon={<User className="h-4 w-4" />}
          />
          <InteractiveHoverButton
            href="#contact"
            text={tr.nav.contact}
            size="sm"
            icon={<Mail className="h-4 w-4" />}
          />
        </div>

        <div className="flex items-center gap-2">
          <LangToggle />
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={open}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-zinc-700 transition hover:text-accent-600 dark:border-white/15 dark:text-zinc-200 lg:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu – plovoucí prosklená karta (stejné „liquid glass" jako dlaždice) */}
      {open && (
        <div className="container-page pointer-events-none absolute inset-x-0 top-full lg:hidden">
          <div className="glass pointer-events-auto mt-2 flex flex-col gap-0.5 rounded-2xl p-2">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-base font-medium text-zinc-700 transition hover:bg-accent-500/10 hover:text-accent-700 dark:text-zinc-100 dark:hover:bg-white/10 dark:hover:text-accent-300"
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
