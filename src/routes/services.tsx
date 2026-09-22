import { createFileRoute, Outlet } from "@tanstack/react-router";
import { z } from "zod";

import { serviceCategories } from "@/lib/cms";

/**
 * Layout for the three service pages. Each category has its own crawlable URL
 * (/services/corporate, /services/weddings, /services/meal-prep); the legacy
 * /services?category=... links still work and redirect to the right page.
 */
export const Route = createFileRoute("/services")({
  validateSearch: z.object({ category: z.enum(serviceCategories).optional() }),
  component: () => <Outlet />,
});
