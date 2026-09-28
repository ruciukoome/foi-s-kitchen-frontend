import { SectionReveal } from "@/components/SectionReveal";

export function PolicyBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <SectionReveal className="flex flex-col gap-3">
      <h2 className="font-display text-xl font-bold md:text-2xl">{title}</h2>
      <div className="flex flex-col gap-3 text-[15px] text-muted-foreground md:text-base">{children}</div>
    </SectionReveal>
  );
}

export const POLICY_UPDATED = "28 September 2026";
