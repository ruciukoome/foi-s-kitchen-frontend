import { createFileRoute } from "@tanstack/react-router";

import { ServicesView } from "@/components/ServicesView";
import { breadcrumbSchema, jsonLd, ogImage, pageSeo, serviceSchema } from "@/lib/seo";

const title = "Weekly Meal Prep Delivery in Nairobi | Foi's Kitchen";
const description =
  "5, 10 or 14 fresh meals cooked, portioned and delivered weekly across Nairobi. Balanced plans adjusted for allergies and portion size.";
const path = "/services/meal-prep";

export const Route = createFileRoute("/services/meal-prep")({
  head: () => {
    const seo = pageSeo({ title, description, path, image: "meal-prep" });
    return {
      ...seo,
      scripts: [
        jsonLd(
          serviceSchema({
            name: "Weekly Meal Prep Plans",
            description,
            path,
            image: ogImage("meal-prep"),
          }),
        ),
        jsonLd(
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Services", path: "/services/corporate" },
            { name: "Meal Prep Plans", path },
          ]),
        ),
      ],
    };
  },
  component: () => <ServicesView category="meal-prep" />,
});
