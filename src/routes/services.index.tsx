import { createFileRoute, redirect } from "@tanstack/react-router";

import { servicePaths } from "@/components/ServicesView";

/** /services (and legacy /services?category=...) sends visitors to the dedicated page. */
export const Route = createFileRoute("/services/")({
  beforeLoad: ({ search }) => {
    throw redirect({ to: servicePaths[search.category ?? "corporate"], replace: true });
  },
});
