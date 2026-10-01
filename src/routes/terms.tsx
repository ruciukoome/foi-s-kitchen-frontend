import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero } from "@/components/PageHero";
import { PolicyBlock, POLICY_UPDATED } from "@/components/PolicyBlock";
import { site } from "@/lib/site";
import { breadcrumbSchema, jsonLd, pageSeo } from "@/lib/seo";

export const Route = createFileRoute("/terms")({
  head: () => ({
    ...pageSeo({
      title: "Terms of Service | Foi's Kitchen Nairobi",
      description:
        "The terms for ordering food, booking catering and meal-prep plans with Foi's Kitchen in Nairobi — payment, delivery, allergies and cancellations.",
      path: "/terms",
    }),
    scripts: [jsonLd(breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Terms of Service", path: "/terms" }]))],
  }),
  component: TermsPage,
});

const a = "font-semibold text-primary hover:underline";

function TermsPage() {
  return (
    <>
      <PageHero
        eyebrow="Terms of Service"
        title="The simple rules behind every plate."
        intro={`By placing an order with ${site.name}, you agree to these terms. Last updated ${POLICY_UPDATED}.`}
      />
      <section className="section-y">
        <div className="container-page flex max-w-3xl flex-col gap-10">
          <PolicyBlock title="Who we are">
            <p>
              {site.name} is a home-style catering, meal-prep and food-ordering kitchen based in {site.address}.
              We cook and deliver across Nairobi. Reach us on{" "}
              <a href={`tel:${site.phoneTel}`} className={a}>{site.phoneDisplay}</a> (calls and WhatsApp) or{" "}
              <a href={`mailto:${site.email}`} className={a}>{site.email}</a>.
            </p>
            {/* TODO: confirm with Foi — registered legal/business name and KRA PIN if different from trading name. */}
          </PolicyBlock>

          <PolicyBlock title="1. Orders & payment">
            <p>
              Online orders, quotation requests and meal-prep plans are sent to us by email or WhatsApp.
              An order is confirmed only once we've replied to confirm it <em>and</em> payment or the agreed
              deposit has been received, usually by M-Pesa.
            </p>
            <p>
              Prices are in Kenya Shillings. They may change, and may vary with the size of the order and the
              services requested. The price we confirm with you is the price you pay.
            </p>
          </PolicyBlock>

          <PolicyBlock title="2. Pre-orders, catering & meal prep">
            <p>
              Catering orders should be placed at least <strong>7 days before the event</strong>. For large events
              of 100 guests or more, we recommend booking at least <strong>14 days in advance</strong>.
            </p>
            <p>
              Catering quotations are valid for <strong>7 days</strong> from the date issued and are subject to
              availability. Large or customised orders need a deposit before we buy ingredients. Meal-prep plans run
              for the number of meals agreed when you sign up.
            </p>
          </PolicyBlock>


          <PolicyBlock title="3. Cancellations & refunds">
            <p>
              A <strong>50% deposit</strong> confirms a catering booking, with the balance due no later than{" "}
              <strong>72 hours before the event</strong>. Cancellations made 14 or more days before the event may
              qualify for a refund of the deposit, less any non-refundable costs already incurred. Cancellations
              7–13 days before may be eligible for a partial refund. Cancellations within 72 hours are
              non-refundable. Meal-prep customers need to give at least <strong>48 hours' notice</strong> to pause,
              reschedule or cancel.
            </p>
            <p className="text-foreground">
              Fresh and perishable food cannot be returned once it has been prepared or delivered, except where it
              is wrong, faulty or not delivered.
            </p>
            <p>
              Full details are in our <Link to="/refund-policy" className={a}>Refund & Cancellation Policy</Link>.
            </p>
          </PolicyBlock>


          <PolicyBlock title="4. Delivery & collection">
            <p>
              Please give an accurate address and phone number and be available to receive your order. Delivery
              charges may apply depending on location. Delivery times are our best estimate. We aren't responsible
              for delays beyond our reasonable control, such as severe traffic, weather or road closures.
            </p>
          </PolicyBlock>

          <PolicyBlock title="5. Allergies & dietary needs">
            <p>
              Tell us about any allergies or dietary needs before you order. We take reasonable care, but our
              kitchen handles many ingredients, including nuts, gluten, dairy, eggs and seafood, so we cannot
              guarantee an allergen-free environment.
            </p>
          </PolicyBlock>

          <PolicyBlock title="6. Food quality & complaints">
            <p>
              Any concerns about an order must be reported within <strong>2 hours of delivery</strong>. You may be
              asked for photographs or other details so we can assess the issue and put it right.
            </p>
          </PolicyBlock>


          <PolicyBlock title="7. Website content">
            <p>
              Menu items, photos, descriptions, prices and availability may change without notice. Everything on this
              website belongs to {site.name} and may not be copied without permission.
            </p>
          </PolicyBlock>

          <PolicyBlock title="8. Privacy">
            <p>
              We use your details to handle orders, provide our services and keep in touch, as set out in our{" "}
              <Link to="/privacy" className={a}>Privacy Policy</Link>.
            </p>
          </PolicyBlock>

          <PolicyBlock title="9. Liability">
            <p>
              We take reasonable care preparing and delivering every order. We aren't responsible for losses caused
              by things beyond our reasonable control. Nothing in these terms removes rights you have under the
              Consumer Protection Act, 2012.
            </p>
          </PolicyBlock>

          <PolicyBlock title="10. Disputes & governing law">
            <p>
              If you're unhappy, please talk to us first — most things are fixed with one message. These terms are
              governed by the laws of Kenya, and any dispute will be handled by the courts of Kenya.
            </p>
          </PolicyBlock>
        </div>
      </section>
    </>
  );
}
