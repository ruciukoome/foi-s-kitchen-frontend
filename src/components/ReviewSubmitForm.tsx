import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Field, TextArea, TextInput } from "@/components/admin/Fields";
import { useAuth } from "@/lib/auth";
import { outlineButtonClass, primaryButtonClass } from "@/lib/ui";

/** Signed-in customers leave a review; it waits for Foi's approval. */
export function ReviewSubmitForm() {
  const { client, user, profile, loading } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [quote, setQuote] = useState("");
  const [rating, setRating] = useState(5);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  if (loading) return null;

  if (!user) {
    return (
      <div className="rounded-2xl border border-border bg-background p-6">
        <p className="font-display text-lg font-semibold">Eaten with us before?</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to your account to leave a review.
        </p>
        <Link to="/sign-in" className={`${primaryButtonClass} mt-4`}>
          Sign in to leave a review
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-border bg-background p-6">
        <p className="font-display text-lg font-semibold">Thank you!</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Your review has been sent and will appear here once Chef Foi approves it.
        </p>
      </div>
    );
  }

  const displayName = name || profile?.full_name || user.email?.split("@")[0] || "";

  async function submit() {
    if (!client || !user) return;
    if (!displayName.trim() || !quote.trim()) {
      toast.error("Please add your name and a few words about the food.");
      return;
    }
    setSaving(true);
    const { error } = await client.from("testimonials").insert({
      name: displayName.trim(),
      role: role.trim() || null,
      quote: quote.trim(),
      rating,
      status: "pending",
      submitted_by: user.id,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["cms", "testimonials"] });
    setDone(true);
  }

  if (!open) {
    return (
      <button type="button" className={outlineButtonClass} onClick={() => setOpen(true)}>
        Leave a review
      </button>
    );
  }

  return (
    <form
      className="grid gap-4 rounded-2xl border border-border bg-background p-6 md:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <div className="md:col-span-2">
        <span className="label-caps text-xs">Your rating</span>
        <div className="mt-2 flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              aria-pressed={rating === n}
              className="grid h-11 w-11 place-items-center"
            >
              <Star
                className={`h-6 w-6 ${n <= rating ? "fill-primary text-primary" : "text-muted-foreground"}`}
                strokeWidth={1.5}
                aria-hidden="true"
              />
            </button>
          ))}
        </div>
      </div>

      <Field label="Your name">
        <TextInput
          value={name || profile?.full_name || ""}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </Field>
      <Field label="What was the occasion?">
        <TextInput
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="Wedding in Karen, weekly meal prep…"
        />
      </Field>
      <Field label="Your review" className="md:col-span-2">
        <TextArea
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          placeholder="Tell us about the food and the service."
          required
        />
      </Field>

      <div className="flex flex-wrap gap-2 md:col-span-2">
        <button type="submit" className={primaryButtonClass} disabled={saving}>
          {saving ? "Sending…" : "Send review"}
        </button>
        <button type="button" className={outlineButtonClass} onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
      <p className="text-xs text-muted-foreground md:col-span-2">
        Reviews appear once Chef Foi has approved them.
      </p>
    </form>
  );
}
