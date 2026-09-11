import type { ReactNode } from "react";

/** Compact Lora-italic page heading row used across the site. */
export function PageHeadingRow({ title, note }: { title: string; note: ReactNode }) {
  return (
    <div className="border-b border-gold/40 bg-card">
      <div className="container-page flex flex-wrap items-baseline gap-x-3 gap-y-1 py-6">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">{title}</h1>
        <p className="font-serif text-[15px] italic text-muted-foreground">〜 {note}</p>
      </div>
    </div>
  );
}
