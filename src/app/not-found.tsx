import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-7xl font-bold text-accent-600 dark:text-accent-400">404</p>
      <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight">
        Stránka nenalezena
      </h1>
      <p className="mt-2 max-w-sm text-zinc-600 dark:text-zinc-300">
        Tahle stránka neexistuje nebo byla přesunuta.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center rounded-full bg-accent-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-500"
      >
        Zpět na úvod
      </Link>
    </main>
  );
}
