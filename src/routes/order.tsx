import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Minus, Plus, Smartphone, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHero } from "@/components/PageHero";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { currency, site, waLink } from "@/lib/site";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/order")({
  head: () => ({
    meta: [
      { title: "Order Online — Foi's Kitchen Nairobi" },
      {
        name: "description",
        content:
          "Review your order, choose delivery or pickup and check out on WhatsApp. Fresh home-style food delivered across Nairobi.",
      },
      { property: "og:title", content: "Order Online — Foi's Kitchen Nairobi" },
      {
        property: "og:description",
        content: "Build your order and finish it on WhatsApp in under a minute.",
      },
    ],
  }),
  component: OrderPage,
});

const steps = ["Your order", "Details", "Checkout"] as const;
const fieldClass =
  "min-h-[48px] w-full rounded-xl border border-input bg-card px-4 py-3 text-base text-foreground outline-none transition-colors duration-200 ease-out focus:border-primary";

function OrderPage() {
  const { lines, total, setQty, remove, clear } = useCart();
  const { client, user, profile } = useAuth();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [prefilled, setPrefilled] = useState(false);
  const [details, setDetails] = useState({
    name: "",
    phone: "",
    method: "Delivery",
    address: "",
    time: "",
    notes: "",
  });

  // Prefill from the signed-in customer's saved profile (still editable).
  useEffect(() => {
    if (prefilled || !profile) return;
    setDetails((d) => ({
      ...d,
      name: d.name || profile.full_name || "",
      phone: d.phone || profile.phone || "",
      method: profile.default_method || d.method,
      address: d.address || profile.default_address || "",
    }));
    setPrefilled(true);
  }, [profile, prefilled]);

  async function saveOrder() {
    setDone(true);
    if (!client) return;
    const { error } = await client.from("orders").insert({
      user_id: user?.id ?? null,
      guest_name: user ? null : details.name,
      guest_phone: user ? null : details.phone,
      items: lines.map((l) => ({ name: l.name, qty: l.qty, price: l.price })),
      total,
      method: details.method,
      address: details.method === "Delivery" ? details.address || null : null,
      preferred_time: details.time || null,
      notes: details.notes || null,
      status: "Received",
    });
    if (error) {
      console.error(error);
      toast.error("We opened WhatsApp, but couldn't save the order for tracking.");
    }
  }




  const orderText = [
    `Hi ${site.name}! I'd like to place this order:`,
    ...lines.map((l) => `• ${l.qty} × ${l.name} — ${currency(l.qty * l.price)}`),
    `Total: ${currency(total)}`,
    "",
    `Name: ${details.name}`,
    `Phone: ${details.phone}`,
    `${details.method}${details.method === "Delivery" ? `: ${details.address}` : ""}`,
    details.time ? `Preferred time: ${details.time}` : "",
    details.notes ? `Notes: ${details.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  if (done) {
    return (
      <section className="section-y">
        <div className="container-page max-w-xl text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary text-primary-foreground">
            <Check className="h-8 w-8" strokeWidth={2} aria-hidden="true" />
          </span>
          <h1 className="mt-6 font-display text-3xl font-bold">Order sent</h1>
          <p className="mt-3 text-muted-foreground">
            We've opened WhatsApp with your order. Send the message and we'll confirm
            the total and delivery time right away.
          </p>

          {user && (
            <p className="mt-4 text-sm text-muted-foreground">
              Track this order anytime under{" "}
              <Link to="/account/orders" className="font-semibold text-primary hover:underline">
                My Orders
              </Link>
              .
            </p>
          )}

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/menu"
              className="label-caps inline-flex min-h-[48px] items-center rounded-full bg-primary px-6 text-primary-foreground transition-all duration-200 ease-out hover:bg-primary-deep hover:scale-[1.02] active:scale-[0.97]"
            >
              Order something else
            </Link>
            <Link
              to="/"
              className="label-caps inline-flex min-h-[48px] items-center rounded-full border border-foreground/20 px-6 transition-all duration-200 ease-out hover:border-primary hover:text-primary"
            >
              Back home
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <PageHero
        eyebrow="Order online"
        title="Build your order, finish on WhatsApp."
        intro="Three quick steps. We confirm everything before you pay a shilling."
      />

      <section className="section-y">
        <div className="container-page max-w-3xl">
          {/* Steps */}
          <ol className="scroll-row -mx-5 px-5 sm:mx-0 sm:flex-wrap sm:px-0">
            {steps.map((s, i) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => i < step && setStep(i)}
                  className={cn(
                    "label-caps min-h-[44px] rounded-full px-4 whitespace-nowrap transition-all duration-300 ease-out",
                    i === step
                      ? "bg-primary text-primary-foreground"
                      : i < step
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground",
                  )}
                >
                  {i + 1}. {s}
                </button>
              </li>
            ))}
          </ol>


          {/* Step 1: cart */}
          {step === 0 && (
            <div className="mt-8 flex flex-col gap-4">
              {lines.length === 0 ? (
                <div className="rounded-2xl bg-card p-8 text-center shadow-card">
                  <p className="text-muted-foreground">Your order is empty.</p>
                  <Link
                    to="/menu"
                    className="label-caps mt-5 inline-flex min-h-[48px] items-center rounded-full bg-primary px-6 text-primary-foreground transition-all duration-200 ease-out hover:bg-primary-deep hover:scale-[1.02] active:scale-[0.97]"
                  >
                    Browse the menu
                  </Link>
                </div>
              ) : (
                <>
                  <ul className="flex flex-col gap-3">
                    {lines.map((l) => (
                      <li
                        key={l.id}
                        className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-card p-4 shadow-card"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-display font-semibold">{l.name}</p>
                          <p className="text-sm text-primary">{currency(l.price)}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            aria-label={`Decrease ${l.name}`}
                            onClick={() => setQty(l.id, l.qty - 1)}
                            className="grid h-11 w-11 place-items-center rounded-full border border-input transition-colors hover:border-primary"
                          >
                            <Minus className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                          </button>
                          <span className="w-8 text-center font-semibold">{l.qty}</span>
                          <button
                            type="button"
                            aria-label={`Increase ${l.name}`}
                            onClick={() => setQty(l.id, l.qty + 1)}
                            className="grid h-11 w-11 place-items-center rounded-full border border-input transition-colors hover:border-primary"
                          >
                            <Plus className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Remove ${l.name}`}
                            onClick={() => remove(l.id)}
                            className="grid h-11 w-11 place-items-center rounded-full text-muted-foreground transition-colors hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center justify-between rounded-2xl bg-secondary p-5">
                    <span className="label-caps">Total</span>
                    <span className="font-display text-xl font-bold text-primary">{currency(total)}</span>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="label-caps inline-flex min-h-[48px] items-center rounded-full bg-primary px-6 text-primary-foreground transition-all duration-200 ease-out hover:bg-primary-deep hover:scale-[1.02] active:scale-[0.97]"
                    >
                      Continue
                    </button>
                    <button
                      type="button"
                      onClick={clear}
                      className="label-caps inline-flex min-h-[48px] items-center rounded-full border border-foreground/20 px-6 transition-colors hover:border-primary hover:text-primary"
                    >
                      Clear order
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 2: details */}
          {step === 1 && (
            <form
              className="mt-8 flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!details.name || !details.phone) {
                  toast.error("We need your name and phone number.");
                  return;
                }
                setStep(2);
              }}
            >
              <div className="flex flex-col gap-2">
                <label htmlFor="o-name" className="label-caps text-xs">Name</label>
                <input
                  id="o-name"
                  className={fieldClass}
                  autoComplete="name"
                  value={details.name}
                  onChange={(e) => setDetails({ ...details, name: e.target.value })}
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="o-phone" className="label-caps text-xs">Phone</label>
                <input
                  id="o-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  className={fieldClass}
                  placeholder="07xx xxx xxx"
                  value={details.phone}
                  onChange={(e) => setDetails({ ...details, phone: e.target.value })}
                  required
                />
              </div>

              <fieldset className="flex flex-col gap-2">
                <legend className="label-caps mb-2 text-xs">How would you like it?</legend>
                <div className="flex gap-2">
                  {["Delivery", "Pickup"].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setDetails({ ...details, method: m })}
                      aria-pressed={details.method === m}
                      className={cn(
                        "label-caps min-h-[48px] flex-1 rounded-full border transition-colors duration-200 ease-out",
                        details.method === m
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input text-muted-foreground hover:border-primary hover:text-primary",
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </fieldset>

              {details.method === "Delivery" && (
                <div className="flex flex-col gap-2">
                  <label htmlFor="o-address" className="label-caps text-xs">Delivery address</label>
                  <input
                    id="o-address"
                    className={fieldClass}
                    autoComplete="street-address"
                    value={details.address}
                    onChange={(e) => setDetails({ ...details, address: e.target.value })}
                  />
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label htmlFor="o-time" className="label-caps text-xs">Preferred time</label>
                <input
                  id="o-time"
                  type="time"
                  className={fieldClass}
                  value={details.time}
                  onChange={(e) => setDetails({ ...details, time: e.target.value })}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="o-notes" className="label-caps text-xs">Notes</label>
                <textarea
                  id="o-notes"
                  rows={3}
                  className={`${fieldClass} min-h-[100px]`}
                  placeholder="Allergies, gate directions, anything else"
                  value={details.notes}
                  onChange={(e) => setDetails({ ...details, notes: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="label-caps inline-flex min-h-[48px] items-center justify-center rounded-full bg-primary px-6 text-primary-foreground transition-all duration-200 ease-out hover:bg-primary-deep hover:scale-[1.02] active:scale-[0.97]"
              >
                Continue to checkout
              </button>
            </form>
          )}

          {/* Step 3: checkout */}
          {step === 2 && (
            <div className="mt-8 flex flex-col gap-4">
              <div className="rounded-2xl bg-card p-6 shadow-card">
                <h2 className="font-display text-lg font-semibold">Order summary</h2>
                <ul className="mt-3 space-y-1 text-sm">
                  {lines.map((l) => (
                    <li key={l.id} className="flex justify-between gap-3">
                      <span className="min-w-0 truncate">{l.qty} × {l.name}</span>
                      <span className="shrink-0 text-primary">{currency(l.qty * l.price)}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 flex justify-between font-display font-bold">
                  <span>Total</span>
                  <span className="text-primary">{currency(total)}</span>
                </p>
              </div>

              <a
                href={waLink(orderText)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => saveOrder()}
                className="label-caps inline-flex min-h-[48px] items-center justify-center rounded-full bg-whatsapp px-6 text-whatsapp-foreground transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.97]"
              >
                Complete via WhatsApp
              </a>

              <div className="flex items-start gap-3 rounded-2xl border border-dashed border-input p-5 text-sm text-muted-foreground">
                <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-primary" strokeWidth={1.75} aria-hidden="true" />
                <p>
                  <strong className="font-display font-semibold text-foreground">M-Pesa STK push — coming soon.</strong>{" "}
                  For now we send an M-Pesa prompt after confirming your order on WhatsApp.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="label-caps inline-flex min-h-[48px] items-center justify-center rounded-full border border-foreground/20 px-6 transition-colors hover:border-primary hover:text-primary"
              >
                Back to details
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
