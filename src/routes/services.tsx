import { createFileRoute, Outlet } from "@tanstack/react-router";

import { serviceCategories, type ServiceCategory } from "@/lib/cms";

function isServiceCategory(value: unknown): value is ServiceCategory {
  return typeof value === "string" && serviceCategories.some((category) => category === value);
}

/**
 * Layout for the three service pages. Each category has its own crawlable URL
 * (/services/corporate, /services/weddings, /services/meal-prep); the legacy
 * /services?category=… links still work and redirect to the right page.
 */
export const Route = createFileRoute("/services")({
  validateSearch: (search: Record<string, unknown>) => ({
    category: isServiceCategory(search["category"]) ? search["category"] : "corporate",
  }),
  component: () => <Outlet />,
});
