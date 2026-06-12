"use client";

import { useEffect, useState } from "react";
import { Menu, X, User, Mail, GraduationCap } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { SITE } from "@/lib/content";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LangToggle } from "@/components/LangToggle";
import GradientMenu from "@/components/ui/gradient-menu";

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

  const links = [
    { href: "#about", label: tr.nav.about },
    { href: "#contact", label: tr.nav.contact },
    { href: "#vyuka", label: tr.nav.lessons },
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "glass-bar" : "border-b border-transparent"
      }`}
    >
      <nav className="container-page flex h-16 items-center justify-between gap-4">
        {/* Logo / monogram */}
        <a href="#top" className="group flex items-center gap-2.5" aria-label={SITE.name}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-600 font-display text-sm font-bold text-white shadow-sm transition group-hover:bg-accent-500">
            {SITE.initials}
          </span>
          <span className="hidden font-display text-sm font-semibold tracking-tight sm:block">
            {SITE.name}
          </span>
        </a>

        {/* Desktop nav – GradientMenu (liquid glass kroužky → smaragdové pilulky) */}
        <div className="hidden md:block">
          <GradientMenu
            items={[
              {
                href: "#about",
                label: tr.nav.about,
                icon: <User className="h-5 w-5" />,
                from: "#34d399",
                to: "#10b981",
              },
              {
                href: "#contact",
                label: tr.nav.contact,
                icon: <Mail className="h-5 w-5" />,
                from: "#10b981",
                to: "#059669",
              },
              {
                href: "#vyuka",
                label: tr.nav.lessons,
                icon: <GraduationCap className="h-5 w-5" />,
                from: "#059669",
                to: "#047857",
              },
            ]}
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
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-zinc-700 transition hover:text-accent-600 dark:border-white/15 dark:text-zinc-200 md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-white/30 bg-white/70 backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-[var(--bg)]/80 md:hidden">
          <div className="container-page flex flex-col py-3">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-3 text-base font-medium text-zinc-700 transition hover:bg-accent-50 hover:text-accent-700 dark:text-zinc-200 dark:hover:bg-white/5 dark:hover:text-accent-400"
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
