import { useEffect, useState } from "react";
import { ChefHat } from "lucide-react";
import { cn } from "@/lib/utils";

/** Soft shimmer block used while kitchen content loads. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-secondary/70", className)} />;
}

const KITCHEN_LINES = [
  "Warming up the pots…",
  "Simmering the sauces…",
  "Rolling the chapatis…",
  "Plating your dishes…",
  "Setting the table…",
];

/** Rotating, food-first status line with a gently bobbing chef hat. */
export function KitchenLoader({ className }: { className?: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setI((n) => (n + 1) % KITCHEN_LINES.length), 1800);
    return () => window.clearInterval(t);
  }, []);
  return (
    <div role="status" aria-live="polite" className={cn("flex items-center justify-center gap-3 py-4 text-muted-foreground", className)}>
      <ChefHat className="h-5 w-5 animate-bounce text-gold" aria-hidden />
      <span key={i} className="font-display text-sm animate-in fade-in duration-300">
        {KITCHEN_LINES[i]}
      </span>
    </div>
  );
}

/** A dish-shaped card: photo, title, price pill and a line of description. */
function DishSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-card shadow-card">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-4 w-2/3 rounded-full" />
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>
        <Skeleton className="h-3 w-full rounded-full" />
        <Skeleton className="h-3 w-4/5 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div>
      <KitchenLoader />
      <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)} aria-hidden>
        {Array.from({ length: count }).map((_, i) => (
          <DishSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/** Text lines shimmer for paragraphs still loading. */
export function SkeletonText({ lines = 4 }: { lines?: number }) {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn("h-3.5 rounded-full", i === lines - 1 ? "w-3/5" : "w-full")} />
      ))}
    </div>
  );
}
