import { Link } from "@tanstack/react-router";
import { menuItems } from "@/data/menu";
import { currency } from "@/lib/site";

// Rotates through the menu so the daily announcement always has a dish.
const featured = [
  menuItems.find((m) => m.id === "pilau")!,
  menuItems.find((m) => m.id === "mshikaki")!,
  menuItems.find((m) => m.id === "samosas-cooked")!,
  menuItems.find((m) => m.id === "chapatis")!,
  menuItems.find((m) => m.id === "pancakes")!,
  menuItems.find((m) => m.id === "banana-bread")!,
  menuItems.find((m) => m.id === "sauteed-potatoes")!,
];

export function MealOfTheDay() {
  const item = featured[new Date().getDay() % featured.length]!;

  return (
    <section className="section-y bg-blush">
      <div className="container-page">
        <div className="grid overflow-hidden rounded-3xl bg-foreground text-background md:grid-cols-2">
          <div className="aspect-[4/3] md:aspect-auto">
            <img
              src={item.image}
              alt={item.name}
              loading="lazy"
              width={1024}
              height={1024}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="flex flex-col justify-center gap-4 p-8 md:p-12">
            <p className="label-caps inline-block border-t border-gold pt-2 text-primary">
              Meal of the day
            </p>
            <h2 className="font-display text-3xl font-bold md:text-4xl">{item.name}</h2>
            <p className="max-w-md text-background/80">{item.description}</p>
            <p className="font-display text-3xl font-bold text-primary">{currency(item.price)}</p>
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
