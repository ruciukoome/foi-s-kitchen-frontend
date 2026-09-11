import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { Service } from "@/data/services";

export function ServiceCard({ service }: { service: Service }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl bg-card shadow-card">
      <div className="aspect-[4/5] overflow-hidden bg-secondary/60">
        <img
          src={service.image}
          alt={service.name}
          loading="lazy"
          decoding="async"
          sizes="(min-width: 768px) 33vw, 100vw"
          width={1024}
          height={1280}
          className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
        />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-6">
        <h3 className="font-display text-xl font-semibold">{service.name}</h3>
        <p className="text-sm text-muted-foreground">{service.description}</p>

        <Link
          to="/services"
          search={{ category: service.category }}
          className="mt-auto inline-flex min-h-[44px] items-center gap-1.5 font-display text-sm font-semibold text-primary transition-colors duration-200 ease-out hover:text-primary-deep"
        >
          Learn more
          <ArrowRight className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
