import { Star } from "lucide-react";
import type { Testimonial } from "@/data/testimonials";

export function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <figure className="flex h-full flex-col gap-4 rounded-2xl bg-card p-6 shadow-card">
      <div className="flex gap-1" aria-label={`${testimonial.rating} out of 5`}>
        {Array.from({ length: testimonial.rating }).map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-primary text-primary" strokeWidth={1.5} aria-hidden="true" />
        ))}
      </div>
      <blockquote className="text-sm leading-relaxed sm:text-base">"{testimonial.quote}"</blockquote>
      <figcaption className="mt-auto flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary font-display text-sm font-semibold">
          {testimonial.name.charAt(0)}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-display text-sm font-semibold">{testimonial.name}</span>
          <span className="block truncate text-xs text-muted-foreground">{testimonial.role}</span>
        </span>
      </figcaption>
    </figure>
  );
}
