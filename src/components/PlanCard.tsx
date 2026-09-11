import { Check } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { currency } from "@/lib/site";
import type { Plan } from "@/data/plans";

export function PlanCard({ plan }: { plan: Plan }) {
  const { add } = useCart();

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl bg-card shadow-card">
      <div className="aspect-[4/5] overflow-hidden">
        <img
          src={plan.image}
          alt={plan.name}
          loading="lazy"
          width={1024}
          height={1024}
          className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
        />
      </div>

      <div className="flex flex-1 flex-col gap-4 p-6">
        <h3 className="font-display text-xl font-semibold">
          {plan.name} — <span className="text-primary">{currency(plan.price)}</span>{" "}
          <span className="text-sm font-normal text-muted-foreground">{plan.cadence}</span>
        </h3>

        <ul className="flex flex-wrap gap-1.5">
          {plan.tags.map((t) => (
            <li key={t} className="rounded-full bg-sage/15 px-2.5 py-1 text-xs font-semibold text-sage">
              {t}
            </li>
          ))}
        </ul>

        <ul className="space-y-2 text-sm">
          {plan.includes.map((line) => (
            <li key={line} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={1.75} aria-hidden="true" />
              <span>{line}</span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => {
            add({ id: `plan-${plan.id}`, name: `${plan.name} plan`, price: plan.price });
            toast.success(`${plan.name} added to your order`);
          }}
          className="label-caps mt-auto flex min-h-[48px] items-center justify-center rounded-full bg-primary px-5 text-primary-foreground transition-all duration-200 ease-out hover:bg-primary-deep hover:scale-[1.02] active:scale-[0.97]"
        >
          Order plan
        </button>
      </div>
    </article>
  );
}
