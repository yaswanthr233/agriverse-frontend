import { cn } from "@/lib/cn";

interface TabsProps {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div role="tablist" className="flex gap-1 border-b border-border">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={t.id === active}
          onClick={() => onChange(t.id)}
          className={cn(
            "-mb-px border-b-2 px-4 py-2 text-sm transition-colors",
            t.id === active
              ? "border-primary-600 font-medium text-primary-700"
              : "border-transparent text-ink-500 hover:text-ink-900",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
