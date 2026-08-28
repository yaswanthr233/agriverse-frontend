export function Footer() {
  return (
    <footer className="border-t border-border bg-surface py-8">
      <div className="mx-auto max-w-[1280px] px-4 text-sm text-ink-500">
        © {new Date().getFullYear()} AgriVerse
      </div>
    </footer>
  );
}
