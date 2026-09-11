import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";

import { PageHeadingRow } from "@/components/PageHeadingRow";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/lib/auth";
import { fieldClass, outlineButtonClass, primaryButtonClass } from "@/lib/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/account/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "My Account — Foi's Kitchen Nairobi" },
      {
        name: "description",
        content: "Update your saved name, phone, delivery address and preferred order method.",
      },
      { property: "og:title", content: "My Account — Foi's Kitchen" },
      { property: "og:description", content: "Your saved details for faster ordering." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <AccountPage />
    </RequireAuth>
  ),
});

function AccountPage() {
  const { client, user, profile, refreshProfile, signOut } = useAuth();
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    default_address: "",
    default_method: "Delivery",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setForm({
      full_name: profile.full_name ?? "",
      phone: profile.phone ?? "",
      default_address: profile.default_address ?? "",
      default_method: profile.default_method ?? "Delivery",
    });
  }, [profile]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!client || !user) return;
    setSaving(true);
    const { error } = await client
      .from("profiles")
      .update({
        full_name: form.full_name || null,
        phone: form.phone || null,
        default_address: form.default_address || null,
        default_method: form.default_method,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Details saved.");
      void refreshProfile();
    }
  }

  return (
    <section className="container-page max-w-2xl pb-16 md:pb-24">
      <PageHeadingRow title="My account" note="Your details, saved for faster checkout." />

      <form className="flex flex-col gap-4 rounded-2xl bg-card p-6 shadow-card md:p-8" onSubmit={onSubmit}>
        <div className="flex flex-col gap-2">
          <label htmlFor="p-name" className="label-caps text-xs">Full name</label>
          <input
            id="p-name"
            className={fieldClass}
            autoComplete="name"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="p-phone" className="label-caps text-xs">Phone</label>
          <input
            id="p-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="07xx xxx xxx"
            className={fieldClass}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="p-address" className="label-caps text-xs">Default delivery address</label>
          <input
            id="p-address"
            className={fieldClass}
            autoComplete="street-address"
            value={form.default_address}
            onChange={(e) => setForm({ ...form, default_address: e.target.value })}
          />
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="label-caps mb-2 text-xs">Preferred method</legend>
          <div className="flex gap-2">
            {["Delivery", "Pickup"].map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={form.default_method === m}
                onClick={() => setForm({ ...form, default_method: m })}
                className={cn(
                  "label-caps min-h-[48px] flex-1 rounded-full border transition-colors duration-200 ease-out",
                  form.default_method === m
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input text-muted-foreground hover:border-primary hover:text-primary",
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={saving} className={primaryButtonClass}>
            {saving ? "Saving…" : "Save details"}
          </button>
          <Link to="/account/orders" className={outlineButtonClass}>
            My orders
          </Link>
          <button type="button" onClick={() => void signOut()} className={outlineButtonClass}>
            Sign out
          </button>
        </div>
      </form>
    </section>
  );
}
