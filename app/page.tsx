import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
        Quins Project Tracker
      </h1>
      <p className="max-w-md text-[var(--text-muted)]">
        Internal delivery tracker for the MyKASIH Phase 2 programme. This is
        internal tooling — access requires authentication.
      </p>
      <Link
        href="/internal"
        className="rounded-md bg-[var(--accent-primary)] px-5 py-2.5 font-medium text-white transition hover:opacity-90"
      >
        Go to internal board
      </Link>
    </main>
  );
}
