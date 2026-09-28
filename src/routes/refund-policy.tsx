import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero } from "@/components/PageHero";
import { PolicyBlock, POLICY_UPDATED } from "@/components/PolicyBlock";
import { WhatsAppLink } from "@/components/CtaButtons";
import { site } from "@/lib/site";
import { breadcrumbSchema, jsonLd, pageSeo } from "@/lib/seo";

export const Route = createFileRoute("/refund-policy")({
  head: () => ({
    ...pageSeo({
      title: "Refund & Cancellation Policy | Foi's Kitchen Nairobi",
      description:
        "When Foi's Kitchen refunds or replaces an order, how to report a problem, and cancellation terms for orders, catering and meal prep in Nairobi.",
      path: "/refund-policy",
    }),
    scripts: [
      jsonLd(breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Refund Policy", path: "/refund-policy" }])),
    ],
  }),
  component: RefundPage,
});

const a = "font-semibold text-primary hover:underline";

function RefundPage() {
  return (
    <>
      <PageHero
        eyebrow="Refunds & cancellations"
        title="If something's wrong, we'll make it right."
        intro={`Fair, clear and food-first. Last updated ${POLICY_UPDATED}.`}
      >
        <WhatsAppLink message={`Hi ${site.name}, there's a problem with my order.`}>Report an issue</WhatsAppLink>
      </PageHero>
      <section className="section-y">
        <div className="container-page flex max-w-3xl flex-col gap-10">
          <PolicyBlock title="When we refund or replace">
            <ul className="list-disc space-y-1 pl-5">
              <li>You received the wrong item, or something was missing.</li>
              <li>There's a genuine quality problem with the food.</li>
              <li>Your order wasn't delivered and it wasn't down to a wrong address or no one being available.</li>
            </ul>
          </PolicyBlock>

          <PolicyBlock title="When we don't">
            <p className="text-foreground">
              Fresh food is perishable. Once we've started preparing your order, or it has been delivered, we can't
              accept a change of mind.
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Wrong address or phone number given, or no one available to receive the order.</li>
              <li>Allergies or dietary needs we weren't told about before ordering.</li>
            </ul>
          </PolicyBlock>

          <PolicyBlock title="How to report a problem">
            <p>
              WhatsApp or call us on <a href={`tel:${site.phoneTel}`} className={a}>{site.phoneDisplay}</a> as soon
              as possible after delivery or collection, ideally within a few hours, with your name, order reference
              and photos of the issue. You can also email <a href={`mailto:${site.email}`} className={a}>{site.email}</a>.
            </p>
            {/* TODO: confirm with Foi — exact reporting window (e.g. 2 hours after delivery). */}
          </PolicyBlock>

          <PolicyBlock title="How refunds are paid">
            <p>
              Depending on the issue, we'll offer a replacement, credit on your next order, or a refund. Refunds go
              back to the M-Pesa number you paid from, as soon as we've confirmed the issue.
            </p>
            {/* TODO: confirm with Foi — M-Pesa refund timeline (e.g. within 24–48 hours). */}
          </PolicyBlock>

          <PolicyBlock title="One-off food orders">
            <p>
              You can cancel for a full refund before we start cooking. Once your food is on the cooker, the order
              can't be cancelled.
            </p>
          </PolicyBlock>

          <PolicyBlock title="Catering & events">
            <p>
              A deposit secures your date and lets us buy ingredients and book staff. If you cancel early, we refund
              the deposit less any costs already incurred. Cancellations close to the event, or after shopping has
              been done, may not be refundable. Changes to guest numbers are welcome up to the cut-off on your quote.
            </p>
            {/* TODO: confirm with Foi — deposit percentage and cancellation lead times (e.g. full refund 14+ days before, non-refundable within 72 hours). */}
          </PolicyBlock>

          <PolicyBlock title="Meal-prep plans">
            <p>
              You can pause, skip or cancel upcoming meals as long as you tell us before we shop and cook for that
              batch. Meals already prepared can't be refunded. Paid-for meals you cancel in time are refunded or
              carried over, whichever you prefer.
            </p>
            {/* TODO: confirm with Foi — notice needed before a batch cook (e.g. 48 hours). */}
          </PolicyBlock>

          <PolicyBlock title="Your legal rights">
            <p>
              This policy doesn't affect your rights under the Consumer Protection Act, 2012. See also our{" "}
              <Link to="/terms" className={a}>Terms of Service</Link>.
            </p>
          </PolicyBlock>
        </div>
      </section>
    </>
  );
}
