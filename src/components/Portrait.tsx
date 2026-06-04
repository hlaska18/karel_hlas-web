import Image from "next/image";
import { SITE } from "@/lib/content";

/**
 * Portrét přes next/image – automaticky servíruje AVIF/WebP ve správné
 * velikosti pro dané zařízení (na mobilu místo 380 kB jen desítky kB).
 * Monogram „KH" je vždy vzadu jako fallback.
 */
export function Portrait({ className = "" }: { className?: string }) {
  return (
    <div
      role="img"
      aria-label={SITE.name}
      className={`relative overflow-hidden rounded-[2rem] border border-black/5 shadow-2xl shadow-accent-900/10 ring-1 ring-black/5 dark:border-white/10 dark:ring-white/10 ${className}`}
    >
      {/* Monogram – fallback vzadu */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-accent-500 to-accent-700">
        <span className="font-display text-7xl font-bold tracking-tight text-white/90 sm:text-8xl">
          {SITE.initials}
        </span>
      </div>

      <Image
        src={SITE.photo}
        alt={SITE.name}
        fill
        priority
        sizes="(max-width: 1024px) 90vw, 450px"
        className="object-cover"
      />
    </div>
  );
}
