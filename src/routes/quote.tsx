import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/PageHero";
import { SectionReveal } from "@/components/SectionReveal";
import { QuoteForm } from "@/components/QuoteForm";
import { WhatsAppLink } from "@/components/CtaButtons";
import { site } from "@/lib/site";

export const Route = createFileRoute("/quote")({
  head: () => ({
    meta: [
      { title: "Request a Quotation — Foi's Kitchen Nairobi" },
      {
        name: "description",
        content:
          "Tell us about your event and get a catering quotation from Foi's Kitchen the same day. Weddings, corporate and private parties in Nairobi.",
      },
      { property: "og:title", content: "Request a Quotation — Foi's Kitchen" },
      {
        property: "og:description",
        content: "Send your event details and get a same-day catering quote.",
      },
    ],
  }),
  component: QuotePage,
});

function QuotePage() {
  return (
    <>
      <PageHero
        eyebrow="Request a quotation"
        title="Tell us what you're planning."
        intro="Fill this in and we'll come back with a menu and a price — usually the same day."
      >
        <WhatsAppLink message={`Hi ${site.name}! I'd like a quotation for an event.`}>
          Continue on WhatsApp
        </WhatsAppLink>
      </PageHero>

      <section className="section-y">
        <div className="container-page max-w-2xl">
          <SectionReveal className="rounded-2xl bg-card p-6 shadow-card md:p-8">
            <QuoteForm context="General quotation" />
          </SectionReveal>
        </div>
      </section>
    </>
  );
}
