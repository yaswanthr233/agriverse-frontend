/** Temporary stand-in. Phases 2–4 replace these with real screens. */
export function PagePlaceholder({ title }: { title: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border-strong bg-surface p-10 text-center">
      <h1 className="text-xl font-semibold text-ink-900">{title}</h1>
      <p className="mt-1 text-sm text-ink-500">
        This screen is built in a later phase.
      </p>
    </div>
  );
}
