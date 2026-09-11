import { cn } from "@/lib/utils";

/** Pill tabs with an animated active pill that slides between options. */
export function CategoryTabs<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly T[];
  value: T;
  onChange: (next: T) => void;
  label: string;
}) {
  return (
    <div className="min-w-0 overflow-x-auto no-scrollbar">
      <div
        role="tablist"
        aria-label={label}
        className="inline-flex min-w-max items-center gap-1 rounded-full border border-border bg-secondary/70 p-1"
      >
        {options.map((option) => {
          const active = option === value;
          return (
            <button
              key={option}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => onChange(option)}
              className={cn(
                "label-caps min-h-[44px] rounded-full px-4 whitespace-nowrap transition-all duration-300 ease-out",
                active
                  ? "bg-primary text-primary-foreground shadow-card"
                  : "text-foreground/70 hover:bg-card hover:text-primary",
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );

}
