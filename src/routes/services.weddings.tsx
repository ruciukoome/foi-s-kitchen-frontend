import { createFileRoute } from "@tanstack/react-router";

import { ServicesView } from "@/components/ServicesView";
import { breadcrumbSchema, jsonLd, ogImage, pageSeo, serviceSchema } from "@/lib/seo";

const title = "Wedding Catering in Nairobi | Foi's Kitchen";
const description =
  "Home-style wedding, ruracio and private party catering in Nairobi. Generous menus, tasting on request, quotations the same day.";
const path = "/services/weddings";

export const Route = createFileRoute("/services/weddings")({
  head: () => {
    const seo = pageSeo({ title, description, path, image: "weddings" });
    return {
      ...seo,
      scripts: [
        jsonLd(
          serviceSchema({
            name: "Wedding & Private Event Catering",
            description,
            path,
            image: ogImage("weddings"),
          }),
        ),
        jsonLd(
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Services", path: "/services/corporate" },
            { name: "Weddings & Private Events", path },
          ]),
        ),
      ],
    };
  },
  component: () => <ServicesView category="weddings" />,
});
