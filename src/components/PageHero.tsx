import type { ReactNode } from "react";

export function PageHero({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children?: ReactNode;
}) {
  return (
    <section className="bg-card">
      <div className="container-page py-11 md:py-20">
        <p className="label-caps animate-fade-up text-primary">{eyebrow}</p>
        <h1
          className="animate-fade-up mt-3 max-w-3xl font-display text-[1.95rem] leading-[1.12] font-bold sm:text-4xl md:text-5xl"
          style={{ animationDelay: "100ms" }}
        >
          {title}
        </h1>
        <p
          className="animate-fade-up mt-3 max-w-2xl text-[15px] text-muted-foreground sm:text-base md:text-[17px]"
          style={{ animationDelay: "200ms" }}
        >
          {intro}
        </p>
        {children && (
          <div
            className="animate-fade-up mt-6 flex flex-col gap-3 sm:mt-7 sm:flex-row sm:flex-wrap [&>*]:w-full sm:[&>*]:w-auto"
            style={{ animationDelay: "300ms" }}
          >
            {children}
          </div>
        )}
      </div>
    </section>

  );
}
