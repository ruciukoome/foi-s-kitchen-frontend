import { createFileRoute, Link } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/admin/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin — Foi's Kitchen" },
      { name: "description", content: "Manage orders, menu, photos and page text for Foi's Kitchen." },
      { property: "og:title", content: "Admin — Foi's Kitchen" },
      { property: "og:description", content: "Internal dashboard for Foi's Kitchen." },
    ],
  }),
  component: AdminHome,
});

const cards = [
  { to: "/admin/orders", title: "Orders", body: "See new orders and update their status." },
  { to: "/admin/menu", title: "Menu", body: "Add dishes, change prices, photos and dietary tags." },
  { to: "/admin/services", title: "Services & tiers", body: "Edit the three service tabs and their pricing cards." },
  { to: "/admin/plans", title: "Meal plans", body: "Edit the weekly meal prep plans." },
  { to: "/admin/testimonials", title: "Reviews", body: "Add or edit customer reviews." },
  { to: "/admin/gallery", title: "Gallery", body: "Manage the photo gallery and its categories." },
  { to: "/admin/content", title: "Page text", body: "Home and About copy, plus your contact details." },
  { to: "/admin/media", title: "Photo library", body: "Upload photos and manage labels and descriptions." },
] as const;

function AdminHome() {
  return (
    <AdminShell title="Dashboard" note="Everything you can edit, in one place.">
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="rounded-2xl border border-border bg-card p-5 transition-colors duration-200 ease-out hover:border-primary"
          >
            <p className="font-display text-lg font-semibold">{c.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{c.body}</p>
          </Link>
        ))}
      </div>
    </AdminShell>
  );
}
