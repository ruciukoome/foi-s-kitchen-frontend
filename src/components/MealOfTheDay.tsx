import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { Skeleton } from "@/components/CmsState";
import { altOf, imageOf, menuItemsQuery } from "@/lib/cms";
import { currency } from "@/lib/site";

export function MealOfTheDay() {
  const { data, isLoading } = useQuery(menuItemsQuery);
  const available = (data ?? []).filter((m) => m.is_available);
  const item = available.length ? available[new Date().getDay() % available.length]! : null;

  return (
    <section className="section-y bg-blush">
      <div className="container-page">
        <div className="grid overflow-hidden rounded-3xl bg-foreground text-background md:grid-cols-2">
          <div className="aspect-[4/3] md:aspect-auto">
            {item ? (
              <img
                src={imageOf(item)}
                alt={altOf(item, item.name)}
                loading="lazy"
                width={1024}
                height={1024}
                className="h-full w-full object-cover"
              />
            ) : (
              <Skeleton className="h-full min-h-[240px] rounded-none" />
            )}
          </div>

          <div className="flex flex-col justify-center gap-4 p-8 md:p-12">
            <p className="label-caps inline-block border-t border-gold pt-2 text-primary">
              Meal of the day
            </p>
            {item ? (
              <>
                <h2 className="font-display text-3xl font-bold md:text-4xl">{item.name}</h2>
                <p className="max-w-md text-background/80">{item.description}</p>
                <p className="font-display text-3xl font-bold text-primary">
                  {currency(Number(item.price))}
                </p>
              </>
            ) : (
              <p className="text-background/80">
                {isLoading ? "Loading today's plate…" : "Today's plate is coming up shortly."}
              </p>
            )}
            <Link
              to="/order"
              className="label-caps mt-2 inline-flex min-h-[48px] w-fit items-center justify-center rounded-full bg-primary px-7 text-primary-foreground transition-all duration-200 ease-out hover:bg-primary-deep hover:scale-[1.02] active:scale-[0.97]"
            >
              Order today's plate
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
