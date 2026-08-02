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
import { SectionHeader } from "@/components/SectionHeader";

export function Contact() {
  const { tr } = useLang();
  const c = tr.contact;

  return (
    <section id="contact" className="py-10 sm:py-14">
      <div className="container-page">
        <SectionHeader
          no="04"
          kicker={c.kicker}
          heading={c.heading}
          intro={c.intro}
          introClassName="mt-4 max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-lg"
        />

        {/* Jednotná mřížka dlaždic – škola je stejná dlaždice jako ostatní */}
        <Reveal as="div" stagger className="mt-12 grid gap-3 sm:grid-cols-2">
          <ContactRow
            icon={<Mail className="h-5 w-5" />}
            label={c.emailLabel}
            value={SITE.email}
            href={`mailto:${SITE.email}`}
          />
          <ContactRow
            icon={<Mail className="h-5 w-5" />}
            label={c.emailPersonalLabel}
            value={SITE.emailPersonal}
            href={`mailto:${SITE.emailPersonal}`}
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
          {/* Škola + adresa (celá dlaždice odkazuje na mapu) */}
          <a href={SITE.mapsUrl} target="_blank" rel="noopener noreferrer" className="group">
            <div className="glass flex h-full items-center gap-4 rounded-2xl p-5 transition group-hover:-translate-y-0.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-600 dark:bg-accent-400/10 dark:text-accent-400">
                <Building2 className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {c.school.split(",")[0]}
                </p>
                <p className="font-medium text-zinc-900 dark:text-white">{SITE.address}</p>
                <p className="mt-0.5 inline-flex items-center gap-1 text-sm font-semibold text-accent-600 transition group-hover:text-accent-500 dark:text-accent-400">
                  <MapPin className="h-3.5 w-3.5" />
                  {c.mapLink}
                  <ArrowUpRight className="h-3 w-3" />
                </p>
              </div>
            </div>
          </a>
        </Reveal>

        {/* Sociální sítě */}
        <div className="mt-10">
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              {c.socialsTitle}
            </p>
          </Reveal>
          <Reveal as="div" stagger className="mt-4 flex flex-wrap gap-3">
            {SOCIALS.map((s) => (
              <a
                key={s.href}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-soft group inline-flex items-center gap-2.5 rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:-translate-y-0.5 hover:text-accent-600 dark:text-zinc-200 dark:hover:text-accent-400"
              >
                {s.network === "instagram" ? (
                  <Instagram className="h-4 w-4" />
                ) : (
                  <Youtube className="h-4 w-4" />
                )}
                {s.handle}
              </a>
            ))}
          </Reveal>
        </div>
        <SectionJump href="#top" label={tr.footer.top} direction="up" />
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
