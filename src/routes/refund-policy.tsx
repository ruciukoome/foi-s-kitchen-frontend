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
              Report any concern within <strong>2 hours of delivery</strong>. WhatsApp or call us on{" "}
              <a href={`tel:${site.phoneTel}`} className={a}>{site.phoneDisplay}</a> with your name, order reference
              and photos of the issue. You can also email <a href={`mailto:${site.email}`} className={a}>{site.email}</a>.
              Photographs or other details may be needed so we can assess the issue.
            </p>
          </PolicyBlock>

          <PolicyBlock title="How refunds are paid">
            <p>
              Depending on the issue, we'll offer a replacement, credit on your next order, or a refund. Refunds go
              back to the M-Pesa number you paid from. Approved M-Pesa refunds are processed within{" "}
              <strong>24–48 hours</strong>, though the time it takes to reflect can vary with your payment provider.
            </p>
          </PolicyBlock>

          <PolicyBlock title="One-off food orders">
            <p>
              You can cancel for a full refund before we start cooking. Once your food is on the cooker, the order
              can't be cancelled.
            </p>
          </PolicyBlock>

          <PolicyBlock title="Catering & events">
            <p>
              Catering orders should be placed at least <strong>7 days before the event</strong>, or{" "}
              <strong>14 days</strong> for 100 guests or more. Quotations are valid for <strong>7 days</strong> and
              are subject to availability. A <strong>50% deposit</strong> confirms your booking, and the balance is
              due no later than <strong>72 hours before the event</strong>.
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li><strong>14 or more days before:</strong> deposit refunded, less any non-refundable costs already incurred.</li>
              <li><strong>7–13 days before:</strong> partial refund, depending on costs already committed.</li>
              <li><strong>Within 72 hours:</strong> non-refundable — food, staffing and preparation costs are already incurred.</li>
            </ul>
            <p>
              If {site.name} cancels an event, you receive a <strong>full refund of all amounts paid</strong>.
            </p>
          </PolicyBlock>

          <PolicyBlock title="Meal-prep plans">
            <p>
              Please give at least <strong>48 hours' notice</strong> to pause, reschedule or cancel. With less than
              48 hours' notice, charges may apply for ingredients, preparation or other costs already incurred.
              Meals already prepared can't be refunded. Meals cancelled in time are refunded or carried over,
              whichever you prefer.
            </p>
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
