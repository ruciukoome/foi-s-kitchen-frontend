import { createFileRoute } from "@tanstack/react-router";

import { ServicesView } from "@/components/ServicesView";
import {
  breadcrumbSchema,
  jsonLd,
  ogImage,
  pageSeo,
  serviceSchema,
} from "@/lib/seo";

const title = "Corporate Catering in Nairobi | Foi's Kitchen";
const description =
  "Office lunches, meetings and staff events catered across Nairobi. Clear per-head pricing, 20-guest minimum, confirmed on WhatsApp.";
const path = "/services/corporate";

export const Route = createFileRoute("/services/corporate")({
  head: () => {
    const seo = pageSeo({ title, description, path, image: "corporate" });
    return {
      ...seo,
      scripts: [
        jsonLd(
          serviceSchema({
            name: "Corporate Catering",
            description,
            path,
            image: ogImage("corporate"),
          }),
        ),
        jsonLd(
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Services", path: "/services/corporate" },
            { name: "Corporate Catering", path },
          ]),
        ),
      ],
    };
  },
  component: () => <ServicesView category="corporate" />,
});
