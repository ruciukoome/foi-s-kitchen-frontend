import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/PageHero";
import { SectionReveal } from "@/components/SectionReveal";
import { QuoteForm } from "@/components/QuoteForm";
import { WhatsAppLink } from "@/components/CtaButtons";
import { site } from "@/lib/site";
import { breadcrumbSchema, jsonLd, pageSeo } from "@/lib/seo";

export const Route = createFileRoute("/quote")({
  head: () => ({
    ...pageSeo({
      title: "Request a Catering Quotation in Nairobi | Foi's Kitchen",
      description:
        "Tell us about your event and get a catering quotation the same day — weddings, corporate lunches and private parties in Nairobi.",
      path: "/quote",
      image: "weddings",
    }),
    scripts: [
      jsonLd(
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Request a quotation", path: "/quote" },
        ]),
      ),
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
