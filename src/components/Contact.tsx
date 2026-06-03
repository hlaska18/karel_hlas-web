"use client";

import {
  MapPin,
  Mail,
  Phone,
  DoorOpen,
  CalendarClock,
  Instagram,
  Youtube,
  Building2,
  ArrowUpRight,
} from "lucide-react";
import { useLang } from "@/lib/i18n";
import { SITE, SOCIALS } from "@/lib/content";
import { Reveal } from "@/components/Reveal";
import { SectionJump } from "@/components/SectionJump";

export function Contact() {
  const { tr } = useLang();
  const c = tr.contact;

  return (
    <section id="contact" className="py-10 sm:py-14">
      <div className="container-page">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-widest text-accent-600 dark:text-accent-400">
            {c.kicker}
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {c.heading}
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-lg">
            {c.intro}
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {/* Škola + adresa */}
          <Reveal className="lg:col-span-1">
            <div className="glass flex h-full flex-col rounded-3xl p-6">
              <div className="flex items-center gap-2.5 text-accent-600 dark:text-accent-400">
                <Building2 className="h-5 w-5" />
                <h3 className="font-display text-base font-semibold text-zinc-900 dark:text-white">
                  {c.school.split(",")[0]}
                </h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                {SITE.address}
              </p>
              <a
                href={SITE.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-accent-600 transition hover:text-accent-500 dark:text-accent-400"
              >
                <MapPin className="h-4 w-4" />
                {c.mapLink}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </Reveal>

          {/* Kontaktní řádky */}
          <Reveal delay={0.05} className="lg:col-span-2">
            <div className="grid h-full gap-3 sm:grid-cols-2">
              <ContactRow
                icon={<Mail className="h-5 w-5" />}
                label={c.emailLabel}
                value={SITE.email}
                href={`mailto:${SITE.email}`}
              />
              <ContactRow
                icon={<Phone className="h-5 w-5" />}
                label={c.phoneLabel}
                value={SITE.phoneDisplay}
                href={`tel:${SITE.phoneHref}`}
              />
              <ContactRow
                icon={<DoorOpen className="h-5 w-5" />}
                label={c.cabinetLabel}
                value={SITE.cabinet}
              />
              <ContactRow
                icon={<CalendarClock className="h-5 w-5" />}
                label={c.consultLabel}
                value={c.consultValue}
                href={SITE.eduPageUrl}
                external
              />
            </div>
          </Reveal>
        </div>

        {/* Sociální sítě */}
        <Reveal delay={0.1}>
          <div className="mt-10">
            <p className="text-sm font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              {c.socialsTitle}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {SOCIALS.map((s) => (
                <a
                  key={s.href}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-soft group inline-flex items-center gap-2.5 rounded-full px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:-translate-y-0.5 hover:text-accent-600 dark:text-zinc-200 dark:hover:text-accent-400"
                >
                  {s.network === "instagram" ? (
                    <Instagram className="h-4 w-4" />
                  ) : (
                    <Youtube className="h-4 w-4" />
                  )}
                  {s.handle}
                </a>
              ))}
            </div>
          </div>
        </Reveal>
        <SectionJump href="#vyuka" label={tr.nav.lessons} />
      </div>
    </section>
  );
}

function ContactRow({
  icon,
  label,
  value,
  href,
  external,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
  external?: boolean;
}) {
  const inner = (
    <div className="glass flex h-full items-center gap-4 rounded-2xl p-5 transition group-hover:-translate-y-0.5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-600 dark:bg-accent-400/10 dark:text-accent-400">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {label}
        </p>
        <p className="truncate font-medium text-zinc-900 dark:text-white">{value}</p>
      </div>
    </div>
  );

  if (!href) return <div className="group">{inner}</div>;

  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="group"
    >
      {inner}
    </a>
  );
}
